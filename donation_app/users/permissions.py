from rest_framework import permissions

class IsModeratorOrSuperUser(permissions.BasePermission):

    # Allow only superusers or moderators to promote/demote user
    def has_permission(self, request, view):
        user = request.user
        return user and user.is_authenticated and (user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'moderator'))