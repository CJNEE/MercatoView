from rest_framework import serializers
from django.contrib.auth import get_user_model
from authentication.models import CustomerProfile, SellerProfile

User = get_user_model()

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['avatar', 'bio', 'preferences']

class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ['business_name', 'contact_number', 'is_verified']

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'profile']

    def get_profile(self, obj):
        if obj.role == 'CUSTOMER':
            try:
                return CustomerProfileSerializer(obj.customer_profile).data
            except CustomerProfile.DoesNotExist:
                return None
        elif obj.role == 'SELLER':
            try:
                return SellerProfileSerializer(obj.seller_profile).data
            except SellerProfile.DoesNotExist:
                return None
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    business_name = serializers.CharField(required=False, write_only=True, allow_blank=True)
    contact_number = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'business_name', 'contact_number']

    def create(self, validated_data):
        role = validated_data.get('role', 'CUSTOMER')
        password = validated_data.pop('password')
        business_name = validated_data.pop('business_name', '')
        contact_number = validated_data.pop('contact_number', '')

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        # Create Profile
        if role == 'SELLER':
            SellerProfile.objects.create(
                user=user, 
                business_name=business_name or f"{user.username}'s Stall",
                contact_number=contact_number
            )
        else:
            CustomerProfile.objects.create(user=user)
        
        return user
