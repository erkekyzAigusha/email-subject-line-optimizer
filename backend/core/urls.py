from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from .views import (
    # Auth
    RegisterView,
    ProfileView,
    ChangePasswordView,
    # Campaigns
    CampaignListCreateView,
    CampaignDetailView,
    CampaignGenerateSubjectsView,
    # Subject lines
    SubjectLineListCreateView,
    SubjectLineDetailView,
    # Chat
    ChatSessionListCreateView,
    ChatSessionDetailView,
    SendMessageView,
    # Admin
    AdminUserListView,
    AdminUserDetailView,
    AdminBlockUserView,
    AdminCampaignListView,
    AdminCampaignDetailView,
    AdminSubjectLineListView,
    AdminSubjectLineDetailView,
)

urlpatterns = [

    # ──────────────────────────────────────────────────────────
    # AUTH  /api/auth/...
    # ──────────────────────────────────────────────────────────

    # Registration
    path("auth/register/",         RegisterView.as_view(),       name="auth-register"),

    # JWT — login returns access + refresh tokens
    path("auth/login/",            TokenObtainPairView.as_view(), name="auth-login"),
    path("auth/token/refresh/",    TokenRefreshView.as_view(),   name="auth-token-refresh"),
    path("auth/token/verify/",     TokenVerifyView.as_view(),    name="auth-token-verify"),

    # Profile
    path("auth/profile/",          ProfileView.as_view(),         name="auth-profile"),
    path("auth/change-password/",  ChangePasswordView.as_view(),  name="auth-change-password"),

    # ──────────────────────────────────────────────────────────
    # CAMPAIGNS  /api/campaigns/...
    # ──────────────────────────────────────────────────────────

    path("campaigns/",             CampaignListCreateView.as_view(),       name="campaign-list"),
    path("campaigns/<int:pk>/",    CampaignDetailView.as_view(),           name="campaign-detail"),

    # One-shot AI subject line generation for a campaign (no chat session needed)
    path("campaigns/<int:pk>/generate/", CampaignGenerateSubjectsView.as_view(), name="campaign-generate"),

    # Subject lines nested under a campaign
    path("campaigns/<int:campaign_id>/subjects/", SubjectLineListCreateView.as_view(), name="subject-list"),

    # ──────────────────────────────────────────────────────────
    # SUBJECT LINES  /api/subjects/...
    # ──────────────────────────────────────────────────────────

    # Standalone subject line actions (retrieve / update / delete by id)
    path("subjects/<int:pk>/",     SubjectLineDetailView.as_view(),        name="subject-detail"),

    # ──────────────────────────────────────────────────────────
    # AI CHAT  /api/chat/...
    # ──────────────────────────────────────────────────────────

    path("chat/sessions/",                ChatSessionListCreateView.as_view(), name="chat-session-list"),
    path("chat/sessions/<int:pk>/",       ChatSessionDetailView.as_view(),     name="chat-session-detail"),

    # Send a message to the AI — core AI endpoint
    path("chat/sessions/<int:pk>/send/",  SendMessageView.as_view(),           name="chat-send"),

    # ──────────────────────────────────────────────────────────
    # ADMIN API  /api/admin/...
    # ──────────────────────────────────────────────────────────

    # User management
    path("admin/users/",                  AdminUserListView.as_view(),          name="admin-user-list"),
    path("admin/users/<int:pk>/",         AdminUserDetailView.as_view(),        name="admin-user-detail"),
    path("admin/users/<int:pk>/block/",   AdminBlockUserView.as_view(),         name="admin-user-block"),

    # Content management (all campaigns / all subject lines)
    path("admin/campaigns/",              AdminCampaignListView.as_view(),      name="admin-campaign-list"),
    path("admin/campaigns/<int:pk>/",     AdminCampaignDetailView.as_view(),    name="admin-campaign-detail"),

    # Moderation (all subject lines across all users)
    path("admin/subjects/",              AdminSubjectLineListView.as_view(),    name="admin-subject-list"),
    path("admin/subjects/<int:pk>/",     AdminSubjectLineDetailView.as_view(),  name="admin-subject-detail"),
]
