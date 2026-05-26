import qrcode
from io import BytesIO
from django.core.files import File
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from promotions.models import Promotion, QRCode, Notification
from promotions.serializers import PromotionSerializer, QRCodeSerializer, NotificationSerializer

class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Promotion.objects.filter(is_active=True)
        stall_id = self.request.query_params.get('stall_id', None)
        if stall_id:
            queryset = queryset.filter(stall_id=stall_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save()

class QRCodeViewSet(viewsets.ModelViewSet):
    queryset = QRCode.objects.all()
    serializer_class = QRCodeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admin sees all, sellers see their own stall's QR codes
        if self.request.user.role == 'ADMIN':
            return QRCode.objects.all()
        elif self.request.user.role == 'SELLER':
            try:
                stall = self.request.user.seller_profile.stall
                return QRCode.objects.filter(stall=stall)
            except Exception:
                return QRCode.objects.none()
        return QRCode.objects.none()

    def perform_create(self, serializer):
        instance = serializer.save()
        # Generate the physical QR Code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(instance.target_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        filename = f"stall_{instance.stall.id}_qr.png"
        if instance.product:
            filename = f"stall_{instance.stall.id}_product_{instance.product.id}_qr.png"

        instance.qr_image.save(filename, File(buffer), save=True)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['POST'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "all marked as read"})

    @action(detail=True, methods=['POST'], url_path='read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({"status": "marked as read"})
