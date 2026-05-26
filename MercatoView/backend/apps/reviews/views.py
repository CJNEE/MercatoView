from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count
from reviews.models import Review, Favorite
from reviews.serializers import ReviewSerializer, FavoriteSerializer
from stalls.models import Stall, Product

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Review.objects.filter(is_approved=True)
        stall_id = self.request.query_params.get('stall_id', None)
        product_id = self.request.query_params.get('product_id', None)

        if stall_id:
            queryset = queryset.filter(stall_id=stall_id)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        # Check if they scanned a QR code (verified review)
        is_verified = self.request.query_params.get('verified', 'false').lower() == 'true'
        review = serializer.save(user=self.request.user, is_verified_purchase=is_verified)
        
        # Recalculate Stall metrics
        self.update_stall_metrics(review.stall)
        
        # Recalculate Product metrics if product was reviewed
        if review.product:
            self.update_product_metrics(review.product)

    def perform_destroy(self, instance):
        stall = instance.stall
        product = instance.product
        instance.delete()
        
        # Re-calculate
        self.update_stall_metrics(stall)
        if product:
            self.update_product_metrics(product)

    def update_stall_metrics(self, stall):
        stats = Review.objects.filter(stall=stall, is_approved=True).aggregate(
            avg_rating=Avg('rating'),
            count=Count('id')
        )
        stall.average_rating = round(stats['avg_rating'] or 0.0, 1)
        stall.reviews_count = stats['count'] or 0
        stall.save()

    def update_product_metrics(self, product):
        from django.db.models import Count
        stats = Review.objects.filter(product=product, is_approved=True).aggregate(
            avg_rating=Avg('rating'),
            count=Count('id')
        )
        product.average_rating = round(stats['avg_rating'] or 0.0, 1)
        product.save()

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def vote_helpful(self, request, pk=None):
        review = self.get_object()
        user = request.user
        if review.helpful_votes.filter(id=user.id).exists():
            review.helpful_votes.remove(user)
            voted = False
        else:
            review.helpful_votes.add(user)
            voted = True
        return Response({
            "helpful_count": review.helpful_votes.count(),
            "has_voted_helpful": voted
        })

class FavoriteViewSet(viewsets.ModelViewSet):
    queryset = Favorite.objects.all()
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['POST'], url_path='toggle')
    def toggle_favorite(self, request):
        stall_id = request.data.get('stall_id', None)
        if not stall_id:
            return Response({"detail": "stall_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            stall = Stall.objects.get(id=stall_id)
        except Stall.DoesNotExist:
            return Response({"detail": "Stall not found."}, status=status.HTTP_404_NOT_FOUND)

        favorite_qs = Favorite.objects.filter(user=request.user, stall=stall)
        if favorite_qs.exists():
            favorite_qs.delete()
            favorited = False
        else:
            Favorite.objects.create(user=request.user, stall=stall)
            favorited = True
            
        return Response({"favorited": favorited})
