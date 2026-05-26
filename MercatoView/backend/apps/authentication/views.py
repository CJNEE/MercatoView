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
