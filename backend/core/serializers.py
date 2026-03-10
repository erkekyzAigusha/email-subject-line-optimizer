from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User, EmailCampaign, SubjectLine, ChatSession, ChatMessage


# ══════════════════════════════════════════════════════════════
# AUTH SERIALIZERS
# ══════════════════════════════════════════════════════════════

class RegisterSerializer(serializers.ModelSerializer):
    """
    Used for POST /api/auth/register/
    - Accepts password + confirm_password.
    - Runs Django's built-in password validators.
    - Never returns the password in the response.
    """

    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ("id", "email", "first_name", "last_name",
                  "password", "confirm_password")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        # Run Django's built-in strength validators
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Used for GET/PATCH /api/auth/profile/
    - Email is read-only after registration.
    - Password is never exposed.
    """

    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model  = User
        fields = ("id", "email", "first_name", "last_name",
                  "full_name", "avatar", "is_admin", "is_user",
                  "is_blocked", "created_at")
        read_only_fields = ("id", "email", "is_admin", "is_user",
                            "is_blocked", "created_at", "full_name")

    def get_full_name(self, obj):
        return obj.full_name


class ChangePasswordSerializer(serializers.Serializer):
    """Used for POST /api/auth/change-password/"""

    old_password     = serializers.CharField(write_only=True)
    new_password     = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["new_password"])
        return attrs


# ══════════════════════════════════════════════════════════════
# EMAIL CAMPAIGN SERIALIZERS
# ══════════════════════════════════════════════════════════════

class SubjectLineSerializer(serializers.ModelSerializer):
    """
    Used inline inside CampaignDetailSerializer and
    as a standalone for /api/campaigns/<id>/subjects/
    """

    class Meta:
        model  = SubjectLine
        fields = ("id", "campaign", "text", "tone",
                  "is_ai_generated", "performance_score", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_text(self, value):
        value = value.strip()
        if len(value) < 5:
            raise serializers.ValidationError("Subject line must be at least 5 characters.")
        if len(value) > 150:
            raise serializers.ValidationError("Subject line must not exceed 150 characters.")
        return value

    def validate_performance_score(self, value):
        if value is not None and not (0 <= value <= 100):
            raise serializers.ValidationError("Score must be between 0 and 100.")
        return value


class EmailCampaignListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the campaign list view.
    Shows a subject line count instead of the full list.
    """

    owner         = serializers.StringRelatedField(read_only=True)
    subject_count = serializers.IntegerField(source="subject_lines.count", read_only=True)

    class Meta:
        model  = EmailCampaign
        fields = ("id", "owner", "title", "industry", "status",
                  "subject_count", "created_at")
        read_only_fields = ("id", "owner", "subject_count", "created_at")


class EmailCampaignDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer for create / retrieve / update.
    Embeds the subject lines so the React frontend
    gets everything in one API call.
    """

    owner         = serializers.StringRelatedField(read_only=True)
    subject_lines = SubjectLineSerializer(many=True, read_only=True)

    class Meta:
        model  = EmailCampaign
        fields = ("id", "owner", "title", "description", "industry",
                  "target_audience", "status", "subject_lines",
                  "created_at", "updated_at")
        read_only_fields = ("id", "owner", "subject_lines",
                            "created_at", "updated_at")

    def validate_title(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters.")
        return value


# ══════════════════════════════════════════════════════════════
# CHAT SERIALIZERS
# ══════════════════════════════════════════════════════════════

class ChatMessageSerializer(serializers.ModelSerializer):
    """Single message — used inside session detail and AI response."""

    class Meta:
        model  = ChatMessage
        fields = ("id", "role", "content", "created_at")
        read_only_fields = ("id", "role", "created_at")


class ChatSessionListSerializer(serializers.ModelSerializer):
    """Lightweight — used for GET /api/chat/sessions/"""

    message_count = serializers.IntegerField(source="messages.count", read_only=True)

    class Meta:
        model  = ChatSession
        fields = ("id", "title", "campaign", "message_count", "created_at")
        read_only_fields = ("id", "message_count", "created_at")


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    """
    Full session with all messages.
    Used for GET /api/chat/sessions/<id>/
    and returned after every AI message send.
    """

    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model  = ChatSession
        fields = ("id", "title", "campaign", "messages", "created_at")
        read_only_fields = ("id", "messages", "created_at")


class SendMessageSerializer(serializers.Serializer):
    """
    Used for POST /api/chat/sessions/<id>/send/
    Accepts only the user's prompt text.
    The view handles saving + calling Groq.
    """

    prompt = serializers.CharField(
        min_length=2,
        max_length=2000,
        help_text="The message to send to the AI assistant."
    )

    def validate_prompt(self, value):
        return value.strip()


# ══════════════════════════════════════════════════════════════
# ADMIN-ONLY SERIALIZERS
# ══════════════════════════════════════════════════════════════

class AdminUserListSerializer(serializers.ModelSerializer):
    """
    Used in GET /api/admin/users/
    Gives admins a full picture of every user account.
    """

    campaign_count = serializers.IntegerField(source="campaigns.count", read_only=True)

    class Meta:
        model  = User
        fields = ("id", "email", "first_name", "last_name",
                  "is_admin", "is_user", "is_active", "is_blocked",
                  "campaign_count", "created_at")
        read_only_fields = fields


class AdminBlockUserSerializer(serializers.Serializer):
    """Used for POST /api/admin/users/<id>/block/"""

    block = serializers.BooleanField(
        help_text="true = block the user, false = unblock."
    )
