from decimal import Decimal

from django.core.management.base import BaseCommand

from vehicles.models import Vehicle

DEMO_VEHICLES = [
    ("Toyota", "Camry", "Sedan", "28500.00", 6),
    ("Toyota", "RAV4", "SUV", "35900.00", 4),
    ("Honda", "Civic", "Sedan", "24200.00", 8),
    ("Honda", "CR-V", "SUV", "33800.00", 3),
    ("Ford", "Mustang", "Coupe", "42500.00", 2),
    ("Ford", "F-150", "Truck", "39900.00", 5),
    ("Tesla", "Model 3", "Electric", "44990.00", 0),
    ("Hyundai", "Ioniq 5", "Electric", "43500.00", 1),
    ("BMW", "3 Series", "Sedan", "46200.00", 2),
    ("Mahindra", "Thar", "SUV", "21000.00", 7),
]


class Command(BaseCommand):
    help = "Insert demo vehicles for local development (skips ones that already exist)."

    def handle(self, *args, **options):
        created = 0
        for make, model, category, price, quantity in DEMO_VEHICLES:
            _, was_created = Vehicle.objects.get_or_create(
                make=make,
                model=model,
                defaults={"category": category, "price": Decimal(price), "quantity": quantity},
            )
            created += was_created
        self.stdout.write(self.style.SUCCESS(f"{created} demo vehicle(s) added."))
