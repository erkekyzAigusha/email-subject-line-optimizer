"""
ai_utils.py — Groq integration for Email Subject Line Optimizer

Flow:
  1. View calls get_ai_response(session, user_prompt)
  2. We build context: system prompt + last 5 messages from DB
  3. We call Groq (llama-3.1-8b-instant)
  4. We save both the user message and AI reply atomically
  5. We return the AI reply text to the view
"""

import logging
import re
import textwrap

from django.conf import settings
from django.db import transaction
from groq import (
    Groq,
    APIConnectionError as GroqConnectionError,
    RateLimitError as GroqRateLimitError,
    APIStatusError as GroqStatusError,
    APITimeoutError as GroqTimeoutError,
)

from .models import ChatMessage, ChatSession, SubjectLine

logger = logging.getLogger("core")

# ── Groq client (reused across requests) ──────────────────────
_client = Groq(api_key=settings.GROQ_API_KEY)

# ── Model ─────────────────────────────────────────────────────
GROQ_MODEL = "llama-3.1-8b-instant"

# ── How many past messages to include in context ──────────────
CONTEXT_WINDOW = 5


# ══════════════════════════════════════════════════════════════
# SYSTEM PROMPT
# ══════════════════════════════════════════════════════════════

def _build_system_prompt(session: ChatSession) -> str:
    """
    Builds the system prompt. If the session is linked to a campaign,
    that campaign's details are injected automatically.
    """

    campaign_context = ""
    if session.campaign:
        c = session.campaign
        campaign_context = f"""
## Current Campaign Context
- **Campaign:** {c.title}
- **Industry:** {c.get_industry_display()}
- **Target Audience:** {c.target_audience or "Not specified"}
- **Description:** {c.description or "Not specified"}

Use this campaign context to make your subject lines highly relevant.
"""

    return f"""You are an expert email copywriter and marketing strategist specializing in high-converting email subject lines.

Your job is to help users craft compelling subject lines that:
- Maximize open rates
- Match the brand tone and audience
- Are concise (under 60 characters is ideal)
- Use proven copywriting techniques (curiosity, urgency, personalization, numbers, etc.)
{campaign_context}
## How to Format Your Responses

Always respond in clean Markdown using this structure:

### [Category Name]  (e.g., Urgency-Based, Curiosity-Based, Personalized)
- Subject line option 1
- Subject line option 2
- Subject line option 3

### Tips
- Brief explanation of why these work
- Any A/B testing suggestions

## Rules
- Generate at least 3 categories with 3 subject lines each (unless user asks otherwise)
- Keep every subject line under 70 characters
- Never use clickbait that misleads the reader
- If the user asks a general question (not subject line generation), answer helpfully in Markdown
- Do not add filler phrases like "Sure!" or "Great question!" — go straight to the content
"""


# ══════════════════════════════════════════════════════════════
# CONTEXT BUILDER
# ══════════════════════════════════════════════════════════════

def _build_message_history(session: ChatSession) -> list[dict]:
    """
    Fetch the last CONTEXT_WINDOW messages in chronological order.
    Strategy: order DESC, slice, then reverse — gets newest N efficiently.
    """

    recent = list(
        session.messages
        .order_by("-created_at")[:CONTEXT_WINDOW]
    )
    recent.reverse()  # restore chronological order for the LLM

    return [{"role": msg.role, "content": msg.content} for msg in recent]


# ══════════════════════════════════════════════════════════════
# SESSION TITLE AUTO-GENERATION
# ══════════════════════════════════════════════════════════════

def _auto_title(prompt: str) -> str:
    """Truncate prompt to a clean title at a word boundary (max 60 chars)."""
    return textwrap.shorten(prompt, width=60, placeholder="…")


# ══════════════════════════════════════════════════════════════
# SUBJECT LINE PARSER
# ══════════════════════════════════════════════════════════════

def _parse_subject_lines(markdown: str) -> list[str]:
    """
    Extract individual subject lines from the AI's Markdown output.
    Looks for bullet points (- or *) that are not section headers or tips.

    Example input:
        ### Urgency-Based
        - Only 24 hours left: Save 40% on everything
        - Flash sale ends tonight — don't miss out

    Returns:
        ["Only 24 hours left: Save 40% on everything",
         "Flash sale ends tonight — don't miss out", ...]
    """
    results = []
    for line in markdown.splitlines():
        line = line.strip()
        # Match bullet lines: "- text" or "* text"
        match = re.match(r'^[-*]\s+(.+)', line)
        if not match:
            continue
        text = match.group(1).strip()
        # Skip markdown-heavy lines (bold section labels, tips headers)
        if text.startswith("**") and text.endswith("**"):
            continue
        # Keep only plausible subject lines (5–150 chars)
        if 5 <= len(text) <= 150:
            results.append(text)
    return results


# ══════════════════════════════════════════════════════════════
# MAIN FUNCTION  (called by the view)
# ══════════════════════════════════════════════════════════════

def get_ai_response(session: ChatSession, user_prompt: str) -> str:
    """
    Core AI utility.

    Args:
        session     — ChatSession ORM object (may have a linked campaign)
        user_prompt — text the user just typed

    Returns:
        AI reply as a Markdown string.

    Raises:
        GroqRateLimitError  — caller should return HTTP 429
        GroqConnectionError — caller should return HTTP 502
        GroqTimeoutError    — caller should return HTTP 504
        GroqStatusError     — caller should return HTTP 502

    Side effects (atomic — both saved or neither):
        Saves the user message and AI reply to ChatMessage.
    """

    # ── 1. Save user message BEFORE calling Groq ──────────────
    # We save first so context window includes the new prompt.
    with transaction.atomic():
        ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.USER,
            content=user_prompt,
        )

    # ── 2. Build payload ───────────────────────────────────────
    history = _build_message_history(session)
    payload = [
        {"role": "system", "content": _build_system_prompt(session)},
        *history,
    ]

    # ── 3. Call Groq ───────────────────────────────────────────
    logger.info("Calling Groq for session=%s user=%s", session.id, session.user_id)
    try:
        completion = _client.chat.completions.create(
            model=GROQ_MODEL,
            messages=payload,
            temperature=0.8,
            max_tokens=1024,
            top_p=1,
            stream=False,
        )
    except GroqRateLimitError:
        logger.warning("Groq rate limit hit for session=%s", session.id)
        raise
    except GroqTimeoutError:
        logger.error("Groq timeout for session=%s", session.id)
        raise
    except (GroqConnectionError, GroqStatusError) as exc:
        logger.error("Groq API error for session=%s: %s", session.id, exc)
        raise

    ai_reply = completion.choices[0].message.content.strip()

    # ── 4. Save AI reply atomically ────────────────────────────
    with transaction.atomic():
        ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.ASSISTANT,
            content=ai_reply,
        )

        # Auto-title on first exchange
        if not session.title:
            session.title = _auto_title(user_prompt)
            session.save(update_fields=["title"])

    logger.info("AI reply saved for session=%s (%d chars)", session.id, len(ai_reply))
    return ai_reply


# ══════════════════════════════════════════════════════════════
# ONE-SHOT CAMPAIGN GENERATION  (no chat session)
# ══════════════════════════════════════════════════════════════

def generate_subject_lines_for_campaign(campaign) -> tuple[str, list[str]]:
    """
    Generate subject lines for a campaign without a chat session.

    Returns:
        (markdown, subject_texts)
        - markdown      — full AI response for display
        - subject_texts — parsed list of individual subject line strings
    """

    prompt = (
        f"Generate email subject lines for this campaign:\n\n"
        f"- **Campaign:** {campaign.title}\n"
        f"- **Industry:** {campaign.get_industry_display()}\n"
        f"- **Target Audience:** {campaign.target_audience or 'General audience'}\n"
        f"- **Description:** {campaign.description or 'No description provided'}\n\n"
        f"Provide at least 3 categories with 3 subject lines each."
    )

    logger.info("One-shot generation for campaign=%s", campaign.id)

    try:
        completion = _client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": _build_system_prompt_minimal()},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.7,   # slightly lower — more consistent for bulk generation
            max_tokens=1024,
            stream=False,
        )
    except (GroqRateLimitError, GroqTimeoutError, GroqConnectionError, GroqStatusError) as exc:
        logger.error("Groq error during campaign generation campaign=%s: %s", campaign.id, exc)
        raise

    markdown = completion.choices[0].message.content.strip()
    subject_texts = _parse_subject_lines(markdown)

    logger.info(
        "Campaign generation done campaign=%s — parsed %d subject lines",
        campaign.id, len(subject_texts)
    )

    return markdown, subject_texts


def _build_system_prompt_minimal() -> str:
    return (
        "You are an expert email copywriter. "
        "Generate high-converting email subject lines formatted in clean Markdown. "
        "Use ### headers for tone categories and bullet points (- ) for each subject line. "
        "Keep every subject line under 70 characters. No filler phrases."
    )
