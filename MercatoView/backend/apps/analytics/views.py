from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from stalls.models import Stall, Product
from reviews.models import Review
from analytics.models import AnalyticsEvent, TrendingRecord
from django.contrib.auth import get_user_model

User = get_user_model()

class LogAnalyticsEventView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        event_type = request.data.get('event_type')
        target_id = request.data.get('target_id')
        target_name = request.data.get('target_name', '')
        extra_data = request.data.get('extra_data', {})

        if not event_type:
            return Response({"detail": "event_type is required"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if request.user.is_authenticated else None

        AnalyticsEvent.objects.create(
            user=user,
            event_type=event_type,
            target_id=target_id,
            target_name=target_name,
            extra_data=extra_data
        )

        return Response({"status": "logged"}, status=status.HTTP_201_CREATED)

class SellerAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'SELLER':
            return Response({"detail": "Only sellers can view stall analytics."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            stall = Stall.objects.get(seller=request.user.seller_profile)
        except Stall.DoesNotExist:
            return Response({"detail": "No stall profile found."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Basic Stats
        total_views = AnalyticsEvent.objects.filter(
            event_type__in=['STALL_VIEW', 'PRODUCT_VIEW'],
            target_id=stall.id
        ).count()

        qr_scans = AnalyticsEvent.objects.filter(
            event_type='QR_SCAN',
            target_id=stall.id
        ).count()

        # 2. Page views by day (last 7 days)
        today = timezone.now().date()
        views_by_day = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = AnalyticsEvent.objects.filter(
                event_type__in=['STALL_VIEW', 'PRODUCT_VIEW'],
                target_id=stall.id,
                timestamp__date=day
            ).count()
            views_by_day.append({
                "date": day.strftime("%a"),
                "views": count
            })

        # 3. Product Popularity (views)
        products = stall.products.all()
        product_stats = []
        for prod in products:
            p_views = AnalyticsEvent.objects.filter(
                event_type='PRODUCT_VIEW',
                target_id=prod.id
            ).count()
            product_stats.append({
                "name": prod.name,
                "views": p_views,
                "rating": prod.average_rating
            })
        product_stats.sort(key=lambda x: x['views'], reverse=True)

        # 4. Rating distribution
        reviews = Review.objects.filter(stall=stall, is_approved=True)
        rating_dist = {i: 0 for i in range(1, 6)}
        for r in reviews:
            rating_dist[r.rating] = rating_dist.get(r.rating, 0) + 1
        
        rating_distribution = [{"rating": f"{k} Star", "count": v} for k, v in rating_dist.items()]

        return Response({
            "stall_name": stall.name,
            "average_rating": stall.average_rating,
            "reviews_count": stall.reviews_count,
            "total_views": total_views,
            "qr_scans": qr_scans,
            "views_by_day": views_by_day,
            "product_popularity": product_stats[:5],
            "rating_distribution": rating_distribution
        })

class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only admins can access system analytics."}, status=status.HTTP_403_FORBIDDEN)

        # System Metrics
        total_users = User.objects.count()
        total_stalls = Stall.objects.count()
        pending_stalls = Stall.objects.filter(is_approved=False).count()
        total_reviews = Review.objects.count()

        # Crowd heatmap data
        # Mapping crowd levels to weight values: LOW=1, MEDIUM=2.5, HIGH=4
        stalls = Stall.objects.filter(is_approved=True)
        heatmap_data = []
        for stall in stalls:
            try:
                loc = stall.location
                weight = 1.0
                if stall.crowd_level == 'MEDIUM':
                    weight = 2.5
                elif stall.crowd_level == 'HIGH':
                    weight = 4.0
                
                heatmap_data.append({
                    "id": stall.id,
                    "name": stall.name,
                    "lat": loc.latitude,
                    "lng": loc.longitude,
                    "crowd_level": stall.crowd_level,
                    "weight": weight
                })
            except Exception:
                continue

        # Trending breakdown
        stalls_by_views = []
        for s in stalls:
            views = AnalyticsEvent.objects.filter(target_id=s.id, event_type='STALL_VIEW').count()
            stalls_by_views.append({
                "name": s.name,
                "views": views,
                "rating": s.average_rating
            })
        stalls_by_views.sort(key=lambda x: x['views'], reverse=True)

        return Response({
            "total_users": total_users,
            "total_stalls": total_stalls,
            "pending_stalls_count": pending_stalls,
            "total_reviews": total_reviews,
            "heatmap_data": heatmap_data,
            "stalls_by_views": stalls_by_views[:10]
        })

class DiscoverLeaderboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Leaderboards
        top_stalls = Stall.objects.filter(is_approved=True).order_by('-average_rating', '-reviews_count')[:10]
        top_products = Product.objects.filter(is_available=True).order_by('-average_rating')[:10]

        from stalls.serializers import StallSerializer, ProductSerializer
        return Response({
            "stalls": StallSerializer(top_stalls, many=True).data,
            "products": ProductSerializer(top_products, many=True).data
        })

class DiscoverTrendingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # AI-powered scoring formula:
        # Score = (Reviews in last 7 days * 3) + (Stall views in last 7 days) + (Crowd level weight * 5)
        # Weight mapping: LOW=1, MEDIUM=3, HIGH=6
        stalls = Stall.objects.filter(is_approved=True)
        time_limit = timezone.now() - timedelta(days=7)
        
        trending_list = []
        for stall in stalls:
            recent_reviews = Review.objects.filter(stall=stall, created_at__gte=time_limit).count()
            recent_views = AnalyticsEvent.objects.filter(
                target_id=stall.id, 
                event_type='STALL_VIEW',
                timestamp__gte=time_limit
            ).count()

            crowd_score = 5
            if stall.crowd_level == 'MEDIUM':
                crowd_score = 15
            elif stall.crowd_level == 'HIGH':
                crowd_score = 30

            score = (recent_reviews * 3.0) + recent_views + crowd_score
            
            # Save historical trending log
            if score > 10: # Only log meaningful trending records
                TrendingRecord.objects.create(stall=stall, score=score, reason="Active engagement and crowd volume")

            trending_list.append({
                "stall_id": stall.id,
                "name": stall.name,
                "cuisine_type": stall.cuisine_type,
                "logo": stall.logo.url if stall.logo else None,
                "average_rating": stall.average_rating,
                "score": score,
                "crowd_level": stall.crowd_level
            })

        # Sort descending
        trending_list.sort(key=lambda x: x['score'], reverse=True)

        return Response(trending_list[:8])
