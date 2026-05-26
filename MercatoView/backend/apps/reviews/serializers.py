from rest_framework import serializers
from reviews.models import Review, Favorite

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    stall_name = serializers.CharField(source='stall.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True, default=None)
    helpful_count = serializers.IntegerField(source='helpful_votes.count', read_only=True)
    has_voted_helpful = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'username', 'stall', 'stall_name', 'product', 'product_name',
            'rating', 'comment', 'image', 'helpful_count', 'has_voted_helpful',
            'is_approved', 'is_verified_purchase', 'created_at'
        ]
        read_only_fields = ['user', 'is_approved', 'is_verified_purchase']

    def get_has_voted_helpful(self, obj):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            return obj.helpful_votes.filter(id=request.user.id).exists()
        return False

class FavoriteSerializer(serializers.ModelSerializer):
    stall_name = serializers.CharField(source='stall.name', read_only=True)
    stall_logo = serializers.ImageField(source='stall.logo', read_only=True)
    stall_cuisine = serializers.CharField(source='stall.cuisine_type', read_only=True)
    stall_rating = serializers.FloatField(source='stall.average_rating', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'stall', 'stall_name', 'stall_logo', 'stall_cuisine', 'stall_rating', 'created_at']
        read_only_fields = ['created_at']
