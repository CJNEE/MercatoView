import os
import django
import random
from django.utils import timezone
from datetime import timedelta

# Initialize Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mercatoview.settings')
import sys
# Make sure apps is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps'))
django.setup()

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from authentication.models import CustomerProfile, SellerProfile
from stalls.models import Stall, StallLocation, Product
from reviews.models import Review, Favorite
from analytics.models import AnalyticsEvent
from promotions.models import Promotion, QRCode, Notification

User = get_user_model()

def seed():
    print("Deleting old database data...")
    User.objects.all().delete()
    Stall.objects.all().delete()
    Review.objects.all().delete()
    AnalyticsEvent.objects.all().delete()
    Promotion.objects.all().delete()
    Notification.objects.all().delete()

    print("Creating admin superuser...")
    admin = User.objects.create_superuser('admin', 'admin@mercatoview.com', 'adminpass')
    admin.role = 'ADMIN'
    admin.save()
    print("Admin: username: admin, password: adminpass")

    print("Creating customer accounts...")
    customers = []
    customer_names = ['cjnee', 'juan_dela_cruz', 'maria_clara', 'sarah_g', 'lucena_foodie']
    for name in customer_names:
        u = User.objects.create_user(name, f"{name}@gmail.com", "pass123")
        u.role = 'CUSTOMER'
        u.save()
        CustomerProfile.objects.get_or_create(user=u, bio=f"Hi, I'm {name.replace('_', ' ').title()}, a local food enthusiast in Lucena!")
        customers.append(u)

    print("Creating seller accounts and stalls...")
    sellers = [
        {"username": "grillmaster", "business": "Grill Master Lucena", "cuisine": "Grill / BBQ", "price": "$$"},
        {"username": "halohalo_queen", "business": "Halo-Halo Queen", "cuisine": "Desserts", "price": "$"},
        {"username": "sisig_king", "business": "Sisig King", "cuisine": "Filipino Classics", "price": "$$"},
        {"username": "ramen_lucena", "business": "Ramen Lucena", "cuisine": "Asian Fusion", "price": "$$$"},
    ]

    # Mercato Lucena coordinates center around (13.9373, 121.6131)
    stall_locations = [
        {"lat": 13.9374, "lng": 121.6130, "sec": "Row A, Stall 1", "desc": "Near the east entrance"},
        {"lat": 13.9372, "lng": 121.6133, "sec": "Row A, Stall 5", "desc": "Next to the live music stage"},
        {"lat": 13.9375, "lng": 121.6131, "sec": "Row B, Stall 2", "desc": "Center aisle block"},
        {"lat": 13.9371, "lng": 121.6128, "sec": "Row C, Stall 4", "desc": "Beside the beverage counter"},
    ]

    dishes = {
        "Grill Master Lucena": [
            {"name": "Pork BBQ Skewers", "price": 35.00, "desc": "Succulent pork skewers glazed in our signature sweet-savory BBQ sauce."},
            {"name": "Inihaw na Liempo", "price": 120.00, "desc": "Grilled pork belly marinated in soy sauce, calamansi, and garlic."},
            {"name": "Chicken Inasal", "price": 135.00, "desc": "Visayan-style grilled chicken quarter marinated in lemongrass, ginger, and achuete."},
        ],
        "Halo-Halo Queen": [
            {"name": "Special Overload Halo-Halo", "price": 99.00, "desc": "Shaved ice, sweetened beans, jelly, ube halaya, leche flan, topped with real ube ice cream."},
            {"name": "Mais Con Yelo", "price": 75.00, "desc": "Sweet corn kernels, crushed ice, evaporated milk, and cornflakes topper."},
            {"name": "Mango Graham Shake", "price": 85.00, "desc": "Thick mango shake layered with crushed graham crackers and sweet cream."},
        ],
        "Sisig King": [
            {"name": "Sizzling Pork Sisig", "price": 150.00, "desc": "Finely chopped pork face, ears, and liver, seasoned with calamansi, onions, and chili on a hot plate."},
            {"name": "Chicken Sisig", "price": 130.00, "desc": "Diced grilled chicken mixed with red onions, green chilis, and mayo sauce."},
            {"name": "Sizzling Tofu Sisig", "price": 100.00, "desc": "Deep-fried tofu cubes tossed in a creamy, savory sauce with bell peppers."},
        ],
        "Ramen Lucena": [
            {"name": "Tonkotsu Ramen", "price": 280.00, "desc": "Thick pork bone broth, chashu slices, soft-boiled egg, nori, and fresh noodles."},
            {"name": "Spicy Miso Ramen", "price": 260.00, "desc": "Savory miso broth with spicy paste, minced chicken, and green onions."},
            {"name": "Gyoza (6pcs)", "price": 120.00, "desc": "Pan-fried pork and vegetable dumplings served with dipping sauce."},
        ]
    }

    comments = [
        "Absolutely amazing! Best food I've had inside Mercato Lucena.",
        "Generous portions and very friendly staff. Highly recommended!",
        "Tastes great but the wait time during peak hours was a bit long.",
        "Delicious, authentic flavors! Will definitely come back for more.",
        "A bit pricey but totally worth it. The flavors are spot on.",
        "Average experience, nothing special but fills the stomach.",
    ]

    for idx, s_data in enumerate(sellers):
        u = User.objects.create_user(s_data['username'], f"{s_data['username']}@gmail.com", "pass123")
        u.role = 'SELLER'
        u.save()

        seller_profile = SellerProfile.objects.create(
            user=u,
            business_name=s_data['business'],
            contact_number=f"+63 917 123 {4000 + idx}",
            is_verified=True
        )

        stall = Stall.objects.create(
            seller=seller_profile,
            name=s_data['business'],
            description=f"Welcome to {s_data['business']}! We serve the finest {s_data['cuisine']} dishes inside Mercato Lucena. Drop by and experience the flavors!",
            cuisine_type=s_data['cuisine'],
            price_range=s_data['price'],
            operating_hours={"Monday-Thursday": "4PM-11PM", "Friday-Sunday": "3PM-12AM"},
            crowd_level=random.choice(['LOW', 'MEDIUM', 'HIGH']),
            is_approved=True,
            is_featured=(idx == 0 or idx == 1)
        )

        loc_data = stall_locations[idx]
        StallLocation.objects.create(
            stall=stall,
            latitude=loc_data['lat'],
            longitude=loc_data['lng'],
            section_name=loc_data['sec'],
            description=loc_data['desc']
        )

        # Create Products
        prod_list = []
        for d in dishes[s_data['business']]:
            p = Product.objects.create(
                stall=stall,
                name=d['name'],
                description=d['desc'],
                price=d['price']
            )
            prod_list.append(p)

        # Create Reviews
        total_rating = 0
        num_reviews = 0
        for customer in customers:
            if random.random() > 0.3: # 70% chance to write a review
                rating = random.choice([4, 5, 5, 4, 3]) # skewed positive
                product = random.choice(prod_list) if random.random() > 0.4 else None
                
                rev = Review.objects.create(
                    user=customer,
                    stall=stall,
                    product=product,
                    rating=rating,
                    comment=random.choice(comments),
                    is_approved=True,
                    is_verified_purchase=random.choice([True, False])
                )
                
                # Add helpful votes
                other_customers = [c for c in customers if c != customer]
                voters = random.sample(other_customers, random.randint(0, len(other_customers)))
                for v in voters:
                    rev.helpful_votes.add(v)

                total_rating += rating
                num_reviews += 1

        if num_reviews > 0:
            stall.average_rating = round(total_rating / num_reviews, 1)
            stall.reviews_count = num_reviews
            stall.save()

            # update product rating
            for p in prod_list:
                p_reviews = Review.objects.filter(product=p, is_approved=True)
                if p_reviews.exists():
                    p.average_rating = round(p_reviews.aggregate(avg=Avg('rating'))['avg'] or 0.0, 1)
                    p.save()

        # Create QR Code records
        QRCode.objects.create(
            stall=stall,
            target_url=f"http://localhost:5173/stalls/{stall.id}?scan=true"
        )
        
        # Create Promotion
        if idx == 0 or idx == 1:
            Promotion.objects.create(
                stall=stall,
                title="Weekend Special Discount!",
                description="Get 10% off when you scan our QR code and leave an authentic review!",
                discount_code=f"MERCATO{stall.id}",
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=30),
                is_active=True
            )

        # Create Notifications for the seller
        Notification.objects.create(
            user=u,
            title="Stall Approved!",
            message="Your stall profile '"+stall.name+"' has been approved by the administrators.",
            notification_type='INFO'
        )
        if stall.reviews_count > 0:
            Notification.objects.create(
                user=u,
                title="New Customer Reviews",
                message=f"Your stall has received {stall.reviews_count} new customer reviews. Check them out on your dashboard!",
                notification_type='REVIEW'
            )

        # Log some Analytics Events (views)
        for _ in range(random.randint(15, 50)):
            AnalyticsEvent.objects.create(
                event_type='STALL_VIEW',
                target_id=stall.id,
                target_name=stall.name,
                timestamp=timezone.now() - timedelta(days=random.randint(0, 6))
            )

    print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed()
