from decimal import Decimal

import pytest

from vehicles.models import Vehicle
from vehicles.tests.factories import VehicleFactory

pytestmark = pytest.mark.django_db


def url(car):
    return f"/api/vehicles/{car.id}"


FULL_UPDATE = {"make": "Subaru", "model": "Outback", "category": "Wagon", "price": "36000.00", "quantity": 9}


def test_updating_requires_authentication(api_client):
    assert api_client.put(url(VehicleFactory()), FULL_UPDATE, format="json").status_code == 401


def test_an_authenticated_user_can_update_a_vehicle(auth_client):
    car = VehicleFactory()

    response = auth_client.put(url(car), FULL_UPDATE, format="json")

    assert response.status_code == 200
    car.refresh_from_db()
    assert (car.make, car.model, car.category, car.quantity) == ("Subaru", "Outback", "Wagon", 9)
    assert car.price == Decimal("36000.00")
    assert response.data["id"] == car.id


def test_put_is_a_full_update_so_missing_fields_are_rejected(auth_client):
    car = VehicleFactory()
    payload = {k: v for k, v in FULL_UPDATE.items() if k != "category"}

    response = auth_client.put(url(car), payload, format="json")

    assert response.status_code == 400
    assert "category" in response.data


def test_patch_updates_only_the_given_fields(auth_client):
    car = VehicleFactory(make="Toyota", price="20000.00")

    response = auth_client.patch(url(car), {"price": "18500.00"}, format="json")

    assert response.status_code == 200
    car.refresh_from_db()
    assert car.price == Decimal("18500.00")
    assert car.make == "Toyota"


def test_updating_with_invalid_data_is_rejected_and_changes_nothing(auth_client):
    car = VehicleFactory(price="20000.00")

    response = auth_client.put(url(car), {**FULL_UPDATE, "price": "-1"}, format="json")

    assert response.status_code == 400
    car.refresh_from_db()
    assert car.price == Decimal("20000.00")


def test_updating_an_unknown_vehicle_returns_404(auth_client):
    assert auth_client.put("/api/vehicles/999999", FULL_UPDATE, format="json").status_code == 404


def test_deleting_requires_authentication(api_client):
    car = VehicleFactory()

    assert api_client.delete(url(car)).status_code == 401
    assert Vehicle.objects.filter(pk=car.pk).exists()


def test_a_regular_user_cannot_delete_a_vehicle(auth_client):
    car = VehicleFactory()

    response = auth_client.delete(url(car))

    assert response.status_code == 403
    assert Vehicle.objects.filter(pk=car.pk).exists()


def test_an_admin_can_delete_a_vehicle(admin_client):
    car = VehicleFactory()

    response = admin_client.delete(url(car))

    assert response.status_code == 204
    assert not Vehicle.objects.filter(pk=car.pk).exists()


def test_deleting_an_unknown_vehicle_returns_404(admin_client):
    assert admin_client.delete("/api/vehicles/999999").status_code == 404
