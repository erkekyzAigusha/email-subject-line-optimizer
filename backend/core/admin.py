from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import User, EmailCampaign, SubjectLine, ChatSession, ChatMessage


# ══════════════════════════════════════════════════════════════
# CUSTOM ACTIONS  (appear in the "Action" dropdown on list pages)
# ══════════════════════════════════════════════════════════════

@admin.action(description="Block selected users")
def block_users(modeladmin, request, queryset):
    # Prevent blocking admin accounts in bulk
    admins_skipped = queryset.filter(is_admin=True).count()
    count = queryset.filter(is_admin=False).update(is_blocked=True, is_active=False)
    modeladmin.message_user(request, f"{count} user(s) blocked.", messages.SUCCESS)
    if admins_skipped:
        modeladmin.message_user(
            request,
            f"{admins_skipped} admin account(s) were skipped.",
            messages.WARNING,
        )


@admin.action(description="Unblock selected users")
def unblock_users(modeladmin, request, queryset):
    count = queryset.update(is_blocked=False, is_active=True)
    modeladmin.message_user(request, f"{count} user(s) unblocked.", messages.SUCCESS)


@admin.action(description="Archive selected campaigns")
def archive_campaigns(modeladmin, request, queryset):
    count = queryset.update(status=EmailCampaign.Status.ARCHIVED)
    modeladmin.message_user(request, f"{count} campaign(s) archived.", messages.SUCCESS)


@admin.action(description="Mark selected subject lines as AI-generated")
def mark_ai_generated(modeladmin, request, queryset):
    count = queryset.update(is_ai_generated=True)
    modeladmin.message_user(request, f"{count} subject line(s) marked as AI-generated.", messages.SUCCESS)


# ══════════════════════════════════════════════════════════════
# USER ADMIN
# ══════════════════════════════════════════════════════════════

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Full-featured user admin:
    - Shows block status with a colour badge
    - Custom actions: block / unblock
    - Separated fieldsets for clarity
    """

    list_display  = ("email", "full_name", "role_badge", "status_badge", "created_at")
    list_filter   = ("is_admin", "is_user", "is_blocked", "is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name")
    ordering      = ("-created_at",)
    actions       = [block_users, unblock_users]

    # ── Detail / Edit form ──────────────────────────────────
    fieldsets = (
        (_("Account"),     {"fields": ("email", "password")}),
        (_("Personal"),    {"fields": ("first_name", "last_name", "avatar")}),
        (_("Roles"),       {"fields": ("is_admin", "is_user")}),
        (_("Status"),      {"fields": ("is_active", "is_blocked", "is_staff")}),
        (_("Permissions"), {"fields": ("is_superuser", "groups", "user_permissions"),
                            "classes": ("collapse",)}),
    )

    # ── Create-user form ────────────────────────────────────
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields":  ("email", "password1", "password2",
                        "first_name", "last_name",
                        "is_admin", "is_user"),
        }),
    )

    # Replace username with email everywhere Django admin expects it
    filter_horizontal = ("groups", "user_permissions")

    # ── Computed display columns ────────────────────────────

    @admin.display(description="Role")
    def role_badge(self, obj):
        if obj.is_admin:
            return format_html('<span style="color:#e74c3c;font-weight:bold;">Admin</span>')
        return format_html('<span style="color:#3498db;">User</span>')

    @admin.display(description="Status")
    def status_badge(self, obj):
        if obj.is_blocked:
            return format_html('<span style="color:#e74c3c;">🔒 Blocked</span>')
        if not obj.is_active:
            return format_html('<span style="color:#95a5a6;">Inactive</span>')
        return format_html('<span style="color:#27ae60;">✓ Active</span>')


# ══════════════════════════════════════════════════════════════
# SUBJECT LINE  (inline inside Campaign)
# ══════════════════════════════════════════════════════════════

class SubjectLineInline(admin.TabularInline):
    """Show subject lines directly inside the campaign detail page."""
    model      = SubjectLine
    extra      = 0          # no empty extra rows
    fields     = ("text", "tone", "is_ai_generated", "performance_score", "created_at")
    readonly_fields = ("created_at",)
    show_change_link = True


# ══════════════════════════════════════════════════════════════
# EMAIL CAMPAIGN ADMIN
# ══════════════════════════════════════════════════════════════

@admin.register(EmailCampaign)
class EmailCampaignAdmin(admin.ModelAdmin):
    """
    Campaign management with inline subject lines.
    Admin can archive campaigns in bulk.
    """

    list_display  = ("title", "owner_link", "industry", "status_badge",
                     "subject_count", "created_at")
    list_filter   = ("status", "industry")
    search_fields = ("title", "description", "owner__email")
    ordering      = ("-created_at",)
    actions       = [archive_campaigns]
    inlines       = [SubjectLineInline]
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (_("Campaign Info"), {
            "fields": ("owner", "title", "description")
        }),
        (_("Targeting"), {
            "fields": ("industry", "target_audience")
        }),
        (_("Status & Dates"), {
            "fields": ("status", "created_at", "updated_at")
        }),
    )

    @admin.display(description="Owner")
    def owner_link(self, obj):
        url = reverse("admin:core_user_change", args=[obj.owner.id])
        return format_html('<a href="{}">{}</a>', url, obj.owner.email)

    @admin.display(description="Subject Lines")
    def subject_count(self, obj):
        count = obj.subject_lines.count()
        return format_html('<b>{}</b>', count)

    @admin.display(description="Status")
    def status_badge(self, obj):
        colours = {
            "draft":    "#f39c12",
            "active":   "#27ae60",
            "archived": "#95a5a6",
        }
        colour = colours.get(obj.status, "#333")
        return format_html(
            '<span style="color:{};font-weight:bold;">{}</span>',
            colour, obj.get_status_display()
        )


# ══════════════════════════════════════════════════════════════
# SUBJECT LINE ADMIN  (standalone page for moderation)
# ══════════════════════════════════════════════════════════════

@admin.register(SubjectLine)
class SubjectLineAdmin(admin.ModelAdmin):
    """
    Standalone subject line page — useful for content moderation.
    Admin can see all subject lines across all users.
    """

    list_display  = ("text_preview", "campaign", "tone", "ai_badge",
                     "performance_score", "created_at")
    list_filter   = ("tone", "is_ai_generated")
    search_fields = ("text", "campaign__title", "campaign__owner__email")
    ordering      = ("-created_at",)
    actions       = [mark_ai_generated]
    readonly_fields = ("created_at",)

    @admin.display(description="Subject Line")
    def text_preview(self, obj):
        return obj.text[:80]

    @admin.display(description="AI?")
    def ai_badge(self, obj):
        if obj.is_ai_generated:
            return format_html('<span style="color:#9b59b6;">🤖 AI</span>')
        return format_html('<span style="color:#7f8c8d;">✍ Manual</span>')


# ══════════════════════════════════════════════════════════════
# CHAT MESSAGE  (inline inside Session)
# ══════════════════════════════════════════════════════════════

class ChatMessageInline(admin.TabularInline):
    model           = ChatMessage
    extra           = 0
    fields          = ("role", "content_preview", "created_at")
    readonly_fields = ("role", "content_preview", "created_at")
    can_delete      = False

    def has_add_permission(self, request, obj=None):
        return False

    @admin.display(description="Content")
    def content_preview(self, obj):
        return obj.content[:120] + ("…" if len(obj.content) > 120 else "")


# ══════════════════════════════════════════════════════════════
# CHAT SESSION ADMIN
# ══════════════════════════════════════════════════════════════

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display  = ("title_or_id", "user", "campaign", "message_count", "created_at")
    list_filter   = ("created_at",)
    search_fields = ("title", "user__email", "campaign__title")
    ordering      = ("-created_at",)
    inlines       = [ChatMessageInline]
    readonly_fields = ("created_at",)

    @admin.display(description="Session")
    def title_or_id(self, obj):
        return obj.title or f"Session #{obj.id}"

    @admin.display(description="Messages")
    def message_count(self, obj):
        return obj.messages.count()


# ══════════════════════════════════════════════════════════════
# CHAT MESSAGE ADMIN  (standalone — for moderation)
# ══════════════════════════════════════════════════════════════

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display  = ("role_badge", "session", "content_preview", "created_at")
    list_filter   = ("role",)
    search_fields = ("content", "session__user__email")
    ordering      = ("-created_at",)
    readonly_fields = ("session", "role", "content", "created_at")

    # Fully read-only: admins can observe but never fabricate or alter messages
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    @admin.display(description="Role")
    def role_badge(self, obj):
        if obj.role == ChatMessage.Role.ASSISTANT:
            return format_html('<span style="color:#9b59b6;">🤖 Assistant</span>')
        return format_html('<span style="color:#2980b9;">👤 User</span>')

    @admin.display(description="Content")
    def content_preview(self, obj):
        return obj.content[:100] + ("…" if len(obj.content) > 100 else "")
