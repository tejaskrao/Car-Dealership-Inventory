from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from vehicles.models import Vehicle
from vehicles.tests.factories import VehicleFactory

pytestmark = pytest.mark.django_db


def test_a_vehicle_has_an_id_make_model_category_price_and_quantity():
    car = Vehicle.objects.create(
        make="Honda", model="Civic", category="Sedan", price=Decimal("22000.50"), quantity=3
    )

    car.refresh_from_db()
    assert car.id is not None
    assert (car.make, car.model, car.category) == ("Honda", "Civic", "Sedan")
    assert car.price == Decimal("22000.50")
    assert car.quantity == 3


def test_quantity_defaults_to_zero():
    car = Vehicle.objects.create(make="Ford", model="Focus", category="Hatchback", price=Decimal("15000"))

    assert car.quantity == 0


def test_price_cannot_be_negative():
    car = VehicleFactory.build(price=Decimal("-1"))

    with pytest.raises(ValidationError):
        car.full_clean()


def test_the_database_also_rejects_a_negative_price():
    from django.db import IntegrityError, transaction

    with pytest.raises(IntegrityError), transaction.atomic():
        Vehicle.objects.create(make="X", model="Y", category="Z", price=Decimal("-5"), quantity=1)


def test_string_representation_is_make_and_model():
    assert str(VehicleFactory.build(make="Tesla", model="Model 3")) == "Tesla Model 3"
