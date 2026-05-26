from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from authentication.serializers import RegisterSerializer, UserSerializer, CustomerProfileSerializer, SellerProfileSerializer
from authentication.models import CustomerProfile, SellerProfile

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        data = request.data
        
        # Simple username/email update
        user.email = data.get('email', user.email)
        user.save()

        # Update specific profiles
        if user.role == 'CUSTOMER':
            profile, _ = CustomerProfile.objects.get_or_create(user=user)
            serializer = CustomerProfileSerializer(profile, data=data.get('profile', {}), partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif user.role == 'SELLER':
            profile, _ = SellerProfile.objects.get_or_create(user=user)
            serializer = SellerProfileSerializer(profile, data=data.get('profile', {}), partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserSerializer(user).data)


class SuspendUserView(APIView):
    """Admin-only: toggle a user's is_active flag to suspend / unsuspend."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only admins can suspend users."}, status=status.HTTP_403_FORBIDDEN)
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Protected accounts: Admins can never be suspended
        # Prevent deactivation of protected admin accounts
        if not target.can_deactivate():
            return Response({"detail": "Administrator accounts cannot be suspended."}, status=status.HTTP_400_BAD_REQUEST)

        target.is_active = not target.is_active
        target.save()
        action_word = "unsuspended" if target.is_active else "suspended"
        return Response({"status": action_word, "is_active": target.is_active})


class ReactivateAllUsersView(APIView):
    """Admin-only: reactivate all suspended accounts."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only admins can reactivate users."}, status=status.HTTP_403_FORBIDDEN)
        # Reactivate all users except admin accounts
        updated = User.objects.filter(is_active=False).exclude(role='ADMIN').update(is_active=True)
        return Response({
            "detail": f"Successfully reactivated {updated} accounts.",
            "status": "success"
        })


class AdminUserListView(APIView):
    """Admin-only: list all users."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only admins can view users."}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all().order_by('-date_joined')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
