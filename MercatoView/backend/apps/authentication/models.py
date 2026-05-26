from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('SELLER', 'Seller'),
        ('CUSTOMER', 'Customer'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='CUSTOMER')

    # Use email for login instead of username if desired, but keep both supported.
    REQUIRED_FIELDS = ['email']

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'ADMIN'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"

    def can_deactivate(self):
        """Return False for admin accounts; they cannot be deactivated."""
        return not (self.role == 'ADMIN' or self.is_superuser)

class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    preferences = models.JSONField(default=dict, blank=True) # e.g. cuisine preferences

    def __str__(self):
        return f"Customer: {self.user.username}"

class SellerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    business_name = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=50, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_documents = models.FileField(upload_to='verification/', null=True, blank=True)

    def __str__(self):
        return f"Seller: {self.business_name} (User: {self.user.username})"
