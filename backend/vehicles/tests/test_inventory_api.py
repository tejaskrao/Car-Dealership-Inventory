import pytest

from vehicles.models import Vehicle
from vehicles.tests.factories import VehicleFactory

pytestmark = pytest.mark.django_db


def purchase_url(car):
    return f"/api/vehicles/{car.id}/purchase"


def restock_url(car):
    return f"/api/vehicles/{car.id}/restock"


class TestPurchaseEndpoint:
    def test_requires_authentication(self, api_client):
        car = VehicleFactory(quantity=3)

        assert api_client.post(purchase_url(car), {}, format="json").status_code == 401
        assert Vehicle.objects.get(pk=car.pk).quantity == 3

    def test_buys_one_unit_when_no_quantity_is_given(self, auth_client):
        car = VehicleFactory(quantity=3)

        response = auth_client.post(purchase_url(car), {}, format="json")

        assert response.status_code == 200
        assert response.data["id"] == car.id
        assert response.data["quantity"] == 2
        assert Vehicle.objects.get(pk=car.pk).quantity == 2

    def test_buys_the_requested_quantity(self, auth_client):
        car = VehicleFactory(quantity=10)

        response = auth_client.post(purchase_url(car), {"quantity": 4}, format="json")

        assert response.status_code == 200
        assert response.data["quantity"] == 6

    def test_out_of_stock_is_a_conflict(self, auth_client):
        car = VehicleFactory(quantity=0)

        response = auth_client.post(purchase_url(car), {}, format="json")

        assert response.status_code == 409
        assert "stock" in response.data["detail"].lower()
        assert Vehicle.objects.get(pk=car.pk).quantity == 0

    def test_asking_for_more_than_available_is_a_conflict(self, auth_client):
        car = VehicleFactory(quantity=2)

        response = auth_client.post(purchase_url(car), {"quantity": 5}, format="json")

        assert response.status_code == 409
        assert Vehicle.objects.get(pk=car.pk).quantity == 2

    @pytest.mark.parametrize("bad", [0, -1, "abc", 1.5, None])
    def test_invalid_quantity_is_a_bad_request(self, auth_client, bad):
        car = VehicleFactory(quantity=5)

        response = auth_client.post(purchase_url(car), {"quantity": bad}, format="json")

        assert response.status_code == 400
        assert "quantity" in response.data

    def test_unknown_vehicle_is_404(self, auth_client):
        assert auth_client.post("/api/vehicles/999999/purchase", {}, format="json").status_code == 404


class TestRestockEndpoint:
    def test_requires_authentication(self, api_client):
        car = VehicleFactory(quantity=1)

        assert api_client.post(restock_url(car), {"quantity": 5}, format="json").status_code == 401

    def test_regular_users_cannot_restock(self, auth_client):
        car = VehicleFactory(quantity=1)

        response = auth_client.post(restock_url(car), {"quantity": 5}, format="json")

        assert response.status_code == 403
        assert Vehicle.objects.get(pk=car.pk).quantity == 1

    def test_an_admin_can_restock(self, admin_client):
        car = VehicleFactory(quantity=1)

        response = admin_client.post(restock_url(car), {"quantity": 5}, format="json")

        assert response.status_code == 200
        assert response.data["quantity"] == 6
        assert Vehicle.objects.get(pk=car.pk).quantity == 6

    def test_restocking_brings_a_sold_out_vehicle_back(self, admin_client, auth_client):
        car = VehicleFactory(quantity=0)
        admin_client.post(restock_url(car), {"quantity": 2}, format="json")

        assert auth_client.post(purchase_url(car), {}, format="json").status_code == 200

    def test_quantity_is_required(self, admin_client):
        car = VehicleFactory(quantity=1)

        response = admin_client.post(restock_url(car), {}, format="json")

        assert response.status_code == 400
        assert "quantity" in response.data

    @pytest.mark.parametrize("bad", [0, -2, "lots", 2.5])
    def test_invalid_quantity_is_a_bad_request(self, admin_client, bad):
        car = VehicleFactory(quantity=1)

        response = admin_client.post(restock_url(car), {"quantity": bad}, format="json")

        assert response.status_code == 400

    def test_unknown_vehicle_is_404(self, admin_client):
        assert admin_client.post("/api/vehicles/999999/restock", {"quantity": 1}, format="json").status_code == 404
