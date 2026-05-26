from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from stalls.models import Stall, Product, StallLocation, StallImage
from stalls.serializers import StallSerializer, StallCreateUpdateSerializer, ProductSerializer
from math import radians, cos, sin, asin, sqrt

class IsSellerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['SELLER', 'ADMIN']

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.role == 'ADMIN':
            return True
        return obj.seller.user == request.user

class StallViewSet(viewsets.ModelViewSet):
    queryset = Stall.objects.all()
    permission_classes = [IsSellerOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StallCreateUpdateSerializer
        return StallSerializer

    def get_queryset(self):
        queryset = Stall.objects.all()
        
        # Public users only see approved stalls unless they are admins
        is_approved = self.request.query_params.get('is_approved', None)
        if is_approved is not None:
            queryset = queryset.filter(is_approved=is_approved.lower() == 'true')
        elif not (self.request.user.is_authenticated and self.request.user.role == 'ADMIN'):
            queryset = queryset.filter(is_approved=True)

        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(cuisine_type__icontains=search) |
                Q(products__name__icontains=search)
            ).distinct()

        # Cuisine filter
        cuisine = self.request.query_params.get('cuisine', None)
        if cuisine:
            queryset = queryset.filter(cuisine_type__iexact=cuisine)

        # Price range filter
        price_range = self.request.query_params.get('price_range', None)
        if price_range:
            queryset = queryset.filter(price_range=price_range)

        # Crowd level filter
        crowd_level = self.request.query_params.get('crowd_level', None)
        if crowd_level:
            queryset = queryset.filter(crowd_level=crowd_level)

        # Featured filter
        featured = self.request.query_params.get('featured', None)
        if featured is not None:
            queryset = queryset.filter(is_featured=featured.lower() == 'true')

        return queryset

    def perform_create(self, serializer):
        # Link to the seller profile of the logged-in user
        from authentication.models import SellerProfile
        seller_profile, _ = SellerProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'business_name': f"{self.request.user.username}'s Stall"}
        )
        serializer.save(seller=seller_profile)

    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def my_stall(self, request):
        if request.user.role != 'SELLER':
            return Response({"detail": "Only sellers have their own stalls."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            stall = Stall.objects.get(seller=request.user.seller_profile)
            serializer = StallSerializer(stall, context={'request': request})
            return Response(serializer.data)
        except Stall.DoesNotExist:
            return Response({"detail": "You have not registered a stall yet."}, status=status.HTTP_404_NOT_FOUND)

    # ── Admin: Approve a stall ──────────────────────────────────────────
    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only admins can approve stalls."}, status=status.HTTP_403_FORBIDDEN)
        stall = self.get_object()
        stall.is_approved = True
        stall.save()
        return Response({"status": "approved"})

    # ── Admin: Reject a stall ───────────────────────────────────────────
    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only admins can reject stalls."}, status=status.HTTP_403_FORBIDDEN)
        stall = self.get_object()
        stall.is_approved = False
        stall.save()
        return Response({"status": "rejected"})

    # ── Seller: Upload gallery images ───────────────────────────────────
    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated],
            parser_classes=[MultiPartParser, FormParser], url_path='add_images')
    def upload_images(self, request, pk=None):
        stall = self.get_object()
        # Only stall owner or admin
        if request.user.role == 'SELLER' and stall.seller.user != request.user:
            return Response({"detail": "Not your stall."}, status=status.HTTP_403_FORBIDDEN)
        files = request.FILES.getlist('images')
        if not files:
            return Response({"detail": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)
        created = []
        for f in files:
            img = StallImage.objects.create(image=f)
            stall.images.add(img)
            created.append({"id": img.id, "url": request.build_absolute_uri(img.image.url)})
        return Response({"uploaded": created}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['GET'], permission_classes=[permissions.AllowAny])
    def nearby(self, request):
        try:
            user_lat = float(request.query_params.get('lat', 13.937))
            user_lng = float(request.query_params.get('lng', 121.613))
            # radius in kilometers, default is 5km
            radius = float(request.query_params.get('radius', 5.0))
        except (ValueError, TypeError):
            return Response({"detail": "Invalid coordinates parameters."}, status=status.HTTP_400_BAD_REQUEST)

        stalls = self.get_queryset()
        nearby_stalls = []

        for stall in stalls:
            try:
                location = stall.location
                dist = self.haversine(user_lng, user_lat, location.longitude, location.latitude)
                if dist <= radius:
                    stall_data = StallSerializer(stall, context={'request': request}).data
                    stall_data['distance_km'] = round(dist, 3)
                    nearby_stalls.append(stall_data)
            except StallLocation.DoesNotExist:
                continue

        # Sort by distance
        nearby_stalls.sort(key=lambda x: x['distance_km'])
        return Response(nearby_stalls)

    @staticmethod
    def haversine(lon1, lat1, lon2, lat2):
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsSellerOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.all()
        stall_id = self.request.query_params.get('stall_id', None)
        if stall_id:
            queryset = queryset.filter(stall_id=stall_id)
        
        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Availability filter
        available = self.request.query_params.get('available', None)
        if available is not None:
            queryset = queryset.filter(is_available=available.lower() == 'true')

        return queryset
