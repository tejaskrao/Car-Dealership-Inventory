"""Test data builders (factory_boy)."""
from decimal import Decimal

import factory

from vehicles.models import Vehicle


class VehicleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Vehicle

    make = "Toyota"
    model = factory.Sequence(lambda n: f"Model-{n}")
    category = "Sedan"
    price = Decimal("25000.00")
    quantity = 5
