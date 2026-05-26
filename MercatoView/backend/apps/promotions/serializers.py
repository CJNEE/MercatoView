from rest_framework import serializers
from promotions.models import Promotion, QRCode, Notification

class PromotionSerializer(serializers.ModelSerializer):
    stall_name = serializers.CharField(source='stall.name', read_only=True)

    class Meta:
        model = Promotion
        fields = ['id', 'stall', 'stall_name', 'title', 'description', 'banner_image', 'discount_code', 'start_date', 'end_date', 'is_active']

class QRCodeSerializer(serializers.ModelSerializer):
    stall_name = serializers.CharField(source='stall.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True, default=None)

    class Meta:
        model = QRCode
        fields = ['id', 'stall', 'stall_name', 'product', 'product_name', 'qr_image', 'target_url', 'created_at']
        read_only_fields = ['qr_image']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'is_read', 'notification_type', 'created_at']
        read_only_fields = ['user', 'created_at']
