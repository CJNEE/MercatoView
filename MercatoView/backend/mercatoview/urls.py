from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Import views
from authentication.views import RegisterView, ProfileView, SuspendUserView, AdminUserListView, ReactivateAllUsersView
from stalls.views import StallViewSet, ProductViewSet
from reviews.views import ReviewViewSet, FavoriteViewSet
from analytics.views import (
    LogAnalyticsEventView, SellerAnalyticsView, 
    AdminAnalyticsView, DiscoverLeaderboardView, DiscoverTrendingView
)
from promotions.views import PromotionViewSet, QRCodeViewSet, NotificationViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'stalls', StallViewSet, basename='stall')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'promotions', PromotionViewSet, basename='promotion')
router.register(r'qrcodes', QRCodeViewSet, basename='qrcode')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # Custom Authentication endpoints
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/profile/', ProfileView.as_view(), name='profile'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin user management
    path('api/admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('api/admin/users/<int:user_id>/suspend/', SuspendUserView.as_view(), name='suspend_user'),
    path('api/admin/users/reactivate-all/', ReactivateAllUsersView.as_view(), name='reactivate_all_users'),
    
    # Custom Analytics endpoints
    path('api/analytics/event/', LogAnalyticsEventView.as_view(), name='log_event'),
    path('api/analytics/seller/', SellerAnalyticsView.as_view(), name='seller_analytics'),
    path('api/analytics/admin/', AdminAnalyticsView.as_view(), name='admin_analytics'),
    
    # Custom Discover endpoints
    path('api/discover/leaderboard/', DiscoverLeaderboardView.as_view(), name='discover_leaderboard'),
    path('api/discover/trending/', DiscoverTrendingView.as_view(), name='discover_trending'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
