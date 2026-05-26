from django.db import models
from django.conf import settings
from stalls.models import Stall, Product

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    stall = models.ForeignKey(Stall, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    
    rating = models.PositiveSmallIntegerField(default=5) # 1 to 5 stars
    comment = models.TextField()
    image = models.ImageField(upload_to='review_photos/', null=True, blank=True)
    
    # Simple helpful counter/reaction
    helpful_votes = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        blank=True, 
        related_name='helpful_reviews'
    )
    
    is_approved = models.BooleanField(default=True)
    # Marks if review was created by scanning a physical QR code at the stall
    is_verified_purchase = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review ({self.rating}*) by {self.user.username} for {self.stall.name}"

class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    stall = models.ForeignKey(Stall, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'stall')

    def __str__(self):
        return f"{self.user.username} favorited {self.stall.name}"
