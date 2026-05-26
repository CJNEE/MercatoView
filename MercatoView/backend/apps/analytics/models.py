from django.db import models
from django.conf import settings
from stalls.models import Stall

class AnalyticsEvent(models.Model):
    EVENT_TYPES = (
        ('STALL_VIEW', 'Stall View'),
        ('PRODUCT_VIEW', 'Product View'),
        ('QR_SCAN', 'QR Code Scan'),
        ('SEARCH_QUERY', 'Search Query'),
        ('CROWD_REPORT', 'Crowd Level Report'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='analytics_events'
    )
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    target_id = models.IntegerField(null=True, blank=True, help_text="ID of target Stall/Product")
    target_name = models.CharField(max_length=255, blank=True, help_text="Meta query term or name")
    extra_data = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} - {self.target_name or self.target_id} at {self.timestamp}"

class TrendingRecord(models.Model):
    stall = models.ForeignKey(Stall, on_delete=models.CASCADE, related_name='trending_records')
    score = models.FloatField(default=0.0)
    reason = models.CharField(max_length=255, blank=True)
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-calculated_at', '-score']

    def __str__(self):
        return f"Trending: {self.stall.name} - Score {self.score} ({self.calculated_at.strftime('%Y-%m-%d')})"
