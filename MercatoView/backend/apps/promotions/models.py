from django.db import models
from django.conf import settings
from stalls.models import Stall, Product

class Promotion(models.Model):
    stall = models.ForeignKey(Stall, on_delete=models.CASCADE, related_name='promotions')
    title = models.CharField(max_length=255)
    description = models.TextField()
    banner_image = models.ImageField(upload_to='promo_banners/', null=True, blank=True)
    discount_code = models.CharField(max_length=50, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Promo: {self.title} by {self.stall.name}"

class QRCode(models.Model):
    stall = models.ForeignKey(Stall, on_delete=models.CASCADE, related_name='qr_codes')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='qr_codes')
    qr_image = models.ImageField(upload_to='qrcodes/', null=True, blank=True)
    target_url = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        type_str = f"Product: {self.product.name}" if self.product else "Stall"
        return f"QR for {self.stall.name} ({type_str})"

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('INFO', 'Informational'),
        ('ALERT', 'Trending Alert / Action Needed'),
        ('PROMO', 'New Promotion'),
        ('REVIEW', 'New Review Notification'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES, default='INFO')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"
