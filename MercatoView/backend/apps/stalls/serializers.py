from rest_framework import serializers
from stalls.models import Stall, StallLocation, Product, ProductImage, StallImage

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = ['id', 'stall', 'name', 'description', 'price', 'is_available', 'average_rating', 'is_trending', 'images', 'uploaded_images']
        read_only_fields = ['average_rating', 'is_trending']

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        product = Product.objects.create(**validated_data)
        for img in uploaded_images:
            ProductImage.objects.create(product=product, image=img)
        return product

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        instance = super().update(instance, validated_data)
        if uploaded_images:
            # Optionally clear old images
            # instance.images.all().delete()
            for img in uploaded_images:
                ProductImage.objects.create(product=instance, image=img)
        return instance

class StallLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StallLocation
        fields = ['latitude', 'longitude', 'section_name', 'description']

class StallSerializer(serializers.ModelSerializer):
    location = StallLocationSerializer(read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    images = serializers.SerializerMethodField()
    seller_username = serializers.CharField(source='seller.user.username', read_only=True)
    seller_business_name = serializers.CharField(source='seller.business_name', read_only=True)

    class Meta:
        model = Stall
        fields = [
            'id', 'seller', 'seller_username', 'seller_business_name',
            'name', 'description', 'logo', 'banner', 'cuisine_type',
            'price_range', 'operating_hours', 'average_rating', 'reviews_count',
            'crowd_level', 'is_featured', 'is_approved', 'location', 'products', 'created_at'
        ]
        read_only_fields = ['average_rating', 'reviews_count', 'is_featured', 'is_approved']

class StallCreateUpdateSerializer(serializers.ModelSerializer):
    location = StallLocationSerializer(required=False)

    class Meta:
        model = Stall
        fields = [
            'name', 'description', 'logo', 'banner', 'cuisine_type',
            'price_range', 'operating_hours', 'crowd_level', 'location'
        ]

    def create(self, validated_data):
        location_data = validated_data.pop('location', None)
        stall = Stall.objects.create(**validated_data)
        if location_data:
            StallLocation.objects.create(stall=stall, **location_data)
        else:
            StallLocation.objects.create(stall=stall)
        return stall

    def update(self, instance, validated_data):
        location_data = validated_data.pop('location', None)
        
        # Update stall fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update location
        if location_data:
            location, _ = StallLocation.objects.get_or_create(stall=instance)
            for attr, value in location_data.items():
                setattr(location, attr, value)
            location.save()
            
        return instance
