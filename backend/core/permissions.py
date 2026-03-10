from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """Allows access only to users with is_admin=True."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsNotBlocked(BasePermission):
    """Denies access to users who have been blocked by an admin."""

    message = "Your account has been blocked. Please contact support."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and not request.user.is_blocked)


class IsOwner(BasePermission):
    """
    Object-level permission: allows access only if obj.owner == request.user.
    Use this on RetrieveUpdateDestroyAPIView to enforce ownership without
    duplicating filter logic in every view's get_queryset().
    """

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user


class IsOwnerOrReadOnly(BasePermission):
    """
    Read-only for safe methods (GET, HEAD, OPTIONS).
    Write access only for the object's owner.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.owner == request.user
