from django.db import models
from authentication.models import SellerProfile

class StallImage(models.Model):
    image = models.ImageField(upload_to='stall_images/')

    def __str__(self):
        return f"Stall Image {self.id}"

class Stall(models.Model):
    CROWD_LEVEL_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    )
    PRICE_RANGE_CHOICES = (
        ('$', 'Budget ($)'),
        ('$$', 'Moderate ($$)'),
        ('$$$', 'Premium ($$$)'),
    )

    seller = models.OneToOneField(SellerProfile, on_delete=models.CASCADE, related_name='stall')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='stall_logos/', null=True, blank=True)
    banner = models.ImageField(upload_to='stall_banners/', null=True, blank=True)
    cuisine_type = models.CharField(max_length=100, help_text="e.g. Grill, Seafood, Filipino, Desserts")
    price_range = models.CharField(max_length=5, choices=PRICE_RANGE_CHOICES, default='$$')
    operating_hours = models.JSONField(default=dict, blank=True, help_text="e.g. {'Monday': '4PM-11PM'}")
    
    # Cached metrics for query performance
    average_rating = models.FloatField(default=0.0)
    reviews_count = models.IntegerField(default=0)
    
    crowd_level = models.CharField(max_length=10, choices=CROWD_LEVEL_CHOICES, default='LOW')
    is_featured = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # New many‑to‑many relationship for additional stall images
    images = models.ManyToManyField(StallImage, blank=True, related_name='stalls')

    def __str__(self):
        return self.name

class StallLocation(models.Model):
    stall = models.OneToOneField(Stall, on_delete=models.CASCADE, related_name='location')
    # Use standard Floats for lat/lng to prevent Windows spatial library DLL dependencies.
    latitude = models.FloatField(default=13.937)
    longitude = models.FloatField(default=121.613)
    section_name = models.CharField(max_length=100, help_text="e.g., Row A, Space 3")
    description = models.CharField(max_length=255, blank=True, help_text="e.g., Near the main stage entrance")

    def __str__(self):
        return f"Location for {self.stall.name}: {self.section_name}"

class Product(models.Model):
    stall = models.ForeignKey(Stall, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_length=10, decimal_places=2, max_digits=10)
    is_available = models.BooleanField(default=True)
    average_rating = models.FloatField(default=0.0)
    is_trending = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.stall.name}"

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')
    
    def __str__(self):
        return f"Image for {self.product.name}"
