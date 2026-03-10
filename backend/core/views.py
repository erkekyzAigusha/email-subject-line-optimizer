import logging

from django.shortcuts import get_object_or_404
from groq import (
    RateLimitError as GroqRateLimitError,
    APITimeoutError as GroqTimeoutError,
)
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .ai_utils import get_ai_response, generate_subject_lines_for_campaign
from .models import User, EmailCampaign, SubjectLine, ChatSession, ChatMessage
from .permissions import IsAdminUser, IsNotBlocked
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    EmailCampaignListSerializer,
    EmailCampaignDetailSerializer,
    SubjectLineSerializer,
    ChatSessionListSerializer,
    ChatSessionDetailSerializer,
    SendMessageSerializer,
    AdminUserListSerializer,
    AdminBlockUserSerializer,
)

logger = logging.getLogger("core")


# ── AI-specific throttle: stricter limit for Groq calls ───────
class AiRateThrottle(UserRateThrottle):
    scope = "ai"


# ══════════════════════════════════════════════════════════════
# AUTH VIEWS
# ══════════════════════════════════════════════════════════════

@extend_schema(tags=["Auth"])
class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Open to everyone — creates a new user account.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        logger.info("New user registered: %s", user.email)
        return Response(
            {
                "message": "Account created successfully.",
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Auth"])
class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/profile/ — view your profile
    PATCH /api/auth/profile/ — update first_name, last_name, avatar
    """

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, IsNotBlocked]
    http_method_names = ["get", "patch"]

    def get_object(self):
        return self.request.user


@extend_schema(tags=["Auth"])
class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""

    permission_classes = [IsAuthenticated, IsNotBlocked]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        logger.info("Password changed for user=%s", user.email)
        return Response({"message": "Password updated successfully."})


# ══════════════════════════════════════════════════════════════
# EMAIL CAMPAIGN VIEWS
# ══════════════════════════════════════════════════════════════

@extend_schema(tags=["Campaigns"])
class CampaignListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/campaigns/ — list your campaigns (paginated)
    POST /api/campaigns/ — create a new campaign
    """

    permission_classes = [IsAuthenticated, IsNotBlocked]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return EmailCampaignDetailSerializer
        return EmailCampaignListSerializer

    def get_queryset(self):
        return EmailCampaign.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        campaign = serializer.save(owner=self.request.user)
        logger.info("Campaign created id=%s owner=%s", campaign.id, self.request.user.email)


@extend_schema(tags=["Campaigns"])
class CampaignDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/campaigns/<id>/ — full campaign with subject lines
    PATCH  /api/campaigns/<id>/ — update fields
    DELETE /api/campaigns/<id>/ — delete campaign
    """

    serializer_class = EmailCampaignDetailSerializer
    permission_classes = [IsAuthenticated, IsNotBlocked]
    http_method_names = ["get", "patch", "delete"]

    def get_queryset(self):
        return EmailCampaign.objects.filter(owner=self.request.user)


@extend_schema(tags=["Campaigns"])
class CampaignGenerateSubjectsView(APIView):
    """
    POST /api/campaigns/<id>/generate/

    AI generates subject lines and saves them directly to the DB.
    Response includes both raw Markdown and the saved SubjectLine objects.
    """

    permission_classes = [IsAuthenticated, IsNotBlocked]
    throttle_classes = [AiRateThrottle]

    def post(self, request, pk):
        campaign = get_object_or_404(EmailCampaign, pk=pk, owner=request.user)

        try:
            markdown, subject_texts = generate_subject_lines_for_campaign(campaign)
        except GroqRateLimitError:
            return Response(
                {"error": "AI rate limit reached. Please wait a moment and try again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except GroqTimeoutError:
            return Response(
                {"error": "AI request timed out. Please try again."},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except Exception as exc:
            logger.error("AI generation failed campaign=%s: %s", pk, exc)
            return Response(
                {"error": "AI service error. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Save each parsed subject line to the DB as is_ai_generated=True
        saved_objects = []
        for text in subject_texts:
            sl = SubjectLine.objects.create(
                campaign=campaign,
                text=text[:150],
                is_ai_generated=True,
            )
            saved_objects.append(sl)

        logger.info("Saved %d AI subject lines for campaign=%s", len(saved_objects), campaign.id)

        return Response({
            "result":      markdown,
            "saved":       SubjectLineSerializer(saved_objects, many=True).data,
            "saved_count": len(saved_objects),
        })


# ══════════════════════════════════════════════════════════════
# SUBJECT LINE VIEWS
# ══════════════════════════════════════════════════════════════

@extend_schema(tags=["Subjects"])
class SubjectLineListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/campaigns/<campaign_id>/subjects/ — list (paginated)
    POST /api/campaigns/<campaign_id>/subjects/ — add manually
    """

    serializer_class = SubjectLineSerializer
    permission_classes = [IsAuthenticated, IsNotBlocked]

    def get_queryset(self):
        return SubjectLine.objects.filter(
            campaign__id=self.kwargs["campaign_id"],
            campaign__owner=self.request.user,
        )

    def perform_create(self, serializer):
        campaign = get_object_or_404(
            EmailCampaign,
            pk=self.kwargs["campaign_id"],
            owner=self.request.user,
        )
        serializer.save(campaign=campaign)


@extend_schema(tags=["Subjects"])
class SubjectLineDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/subjects/<id>/"""

    serializer_class = SubjectLineSerializer
    permission_classes = [IsAuthenticated, IsNotBlocked]
    http_method_names = ["get", "patch", "delete"]

    def get_queryset(self):
        return SubjectLine.objects.filter(campaign__owner=self.request.user)


# ══════════════════════════════════════════════════════════════
# CHAT VIEWS
# ══════════════════════════════════════════════════════════════

@extend_schema(tags=["AI Chat"])
class ChatSessionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/chat/sessions/ — list sessions (paginated)
    POST /api/chat/sessions/ — start new session
    """

    permission_classes = [IsAuthenticated, IsNotBlocked]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChatSessionDetailSerializer
        return ChatSessionListSerializer

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(tags=["AI Chat"])
class ChatSessionDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/chat/sessions/<id>/ — full session with all messages
    DELETE /api/chat/sessions/<id>/ — delete session + all messages
    """

    serializer_class = ChatSessionDetailSerializer
    permission_classes = [IsAuthenticated, IsNotBlocked]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


@extend_schema(tags=["AI Chat"])
class SendMessageView(APIView):
    """
    POST /api/chat/sessions/<id>/send/
    Body: { "prompt": "..." }

    Throttled via AiRateThrottle.
    Returns ai_reply (string) + full updated session object.
    """

    permission_classes = [IsAuthenticated, IsNotBlocked]
    throttle_classes = [AiRateThrottle]

    def post(self, request, pk):
        session = get_object_or_404(ChatSession, pk=pk, user=request.user)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prompt = serializer.validated_data["prompt"]

        try:
            ai_reply = get_ai_response(session, prompt)
        except GroqRateLimitError:
            return Response(
                {"error": "AI rate limit reached. Please wait a moment and try again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except GroqTimeoutError:
            return Response(
                {"error": "AI request timed out. Please try again."},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except Exception as exc:
            logger.error("AI response failed session=%s: %s", pk, exc)
            return Response(
                {"error": "AI service error. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        session.refresh_from_db()
        return Response(
            {
                "ai_reply": ai_reply,
                "session":  ChatSessionDetailSerializer(session).data,
            },
            status=status.HTTP_200_OK,
        )


# ══════════════════════════════════════════════════════════════
# ADMIN VIEWS
# ══════════════════════════════════════════════════════════════

@extend_schema(tags=["Admin"])
class AdminUserListView(generics.ListAPIView):
    """GET /api/admin/users/ — ?search=email  ?is_blocked=true/false"""

    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        qs = User.objects.all()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(email__icontains=search)
        is_blocked = self.request.query_params.get("is_blocked")
        if is_blocked is not None:
            qs = qs.filter(is_blocked=is_blocked.lower() == "true")
        return qs


@extend_schema(tags=["Admin"])
class AdminUserDetailView(generics.RetrieveAPIView):
    """GET /api/admin/users/<id>/"""

    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = User.objects.all()


@extend_schema(tags=["Admin"])
class AdminBlockUserView(APIView):
    """
    POST /api/admin/users/<id>/block/
    { "block": true }  → block  |  { "block": false } → unblock
    Cannot block self or other admins.
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        if user == request.user:
            return Response(
                {"error": "You cannot block yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.is_admin:
            return Response(
                {"error": "Admin accounts cannot be blocked via this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdminBlockUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        block = serializer.validated_data["block"]
        user.is_blocked = block
        user.is_active  = not block
        user.save(update_fields=["is_blocked", "is_active"])

        action = "blocked" if block else "unblocked"
        logger.info("Admin %s %s user %s", request.user.email, action, user.email)
        return Response({"message": f"User {user.email} has been {action}."})


@extend_schema(tags=["Admin"])
class AdminCampaignListView(generics.ListAPIView):
    """GET /api/admin/campaigns/ — ?status=  ?owner=email"""

    serializer_class = EmailCampaignListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        qs = EmailCampaign.objects.select_related("owner").all()
        if s := self.request.query_params.get("status"):
            qs = qs.filter(status=s)
        if o := self.request.query_params.get("owner"):
            qs = qs.filter(owner__email__icontains=o)
        return qs


@extend_schema(tags=["Admin"])
class AdminCampaignDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/admin/campaigns/<id>/"""

    serializer_class = EmailCampaignDetailSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = EmailCampaign.objects.all()
    http_method_names = ["get", "patch", "delete"]


@extend_schema(tags=["Admin"])
class AdminSubjectLineListView(generics.ListAPIView):
    """GET /api/admin/subjects/ — ?is_ai_generated=true/false"""

    serializer_class = SubjectLineSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        qs = SubjectLine.objects.select_related("campaign__owner").all()
        is_ai = self.request.query_params.get("is_ai_generated")
        if is_ai is not None:
            qs = qs.filter(is_ai_generated=is_ai.lower() == "true")
        return qs


@extend_schema(tags=["Admin"])
class AdminSubjectLineDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/admin/subjects/<id>/"""

    serializer_class = SubjectLineSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = SubjectLine.objects.all()
    http_method_names = ["get", "patch", "delete"]
