from decimal import Decimal

import pytest

from vehicles.models import Vehicle
from vehicles.tests.factories import VehicleFactory

pytestmark = pytest.mark.django_db

URL = "/api/vehicles"
VALID = {"make": "Mazda", "model": "CX-5", "category": "SUV", "price": "31000.00", "quantity": 4}


def test_listing_requires_authentication(api_client):
    assert api_client.get(URL).status_code == 401


def test_creating_requires_authentication(api_client):
    assert api_client.post(URL, VALID, format="json").status_code == 401


def test_list_returns_every_vehicle_including_out_of_stock_ones(auth_client):
    VehicleFactory(make="Audi", model="A4", quantity=2)
    VehicleFactory(make="BMW", model="X1", quantity=0)

    response = auth_client.get(URL)

    assert response.status_code == 200
    assert [(v["make"], v["quantity"]) for v in response.data] == [("Audi", 2), ("BMW", 0)]


def test_list_items_expose_the_documented_fields(auth_client):
    car = VehicleFactory(make="Kia", model="Rio", category="Hatchback", price=Decimal("12000.00"), quantity=7)

    item = auth_client.get(URL).data[0]

    assert set(item) == {"id", "make", "model", "category", "price", "quantity"}
    assert item["id"] == car.id
    assert Decimal(str(item["price"])) == Decimal("12000.00")


def test_list_is_ordered_by_make_then_model(auth_client):
    VehicleFactory(make="Toyota", model="Yaris")
    VehicleFactory(make="Toyota", model="Camry")
    VehicleFactory(make="Audi", model="Q3")

    names = [f'{v["make"]} {v["model"]}' for v in auth_client.get(URL).data]

    assert names == ["Audi Q3", "Toyota Camry", "Toyota Yaris"]


def test_an_authenticated_user_can_add_a_vehicle(auth_client):
    response = auth_client.post(URL, VALID, format="json")

    assert response.status_code == 201
    assert response.data["id"]
    saved = Vehicle.objects.get(pk=response.data["id"])
    assert (saved.make, saved.model, saved.category, saved.quantity) == ("Mazda", "CX-5", "SUV", 4)
    assert saved.price == Decimal("31000.00")


def test_quantity_is_optional_and_defaults_to_zero(auth_client):
    payload = {k: v for k, v in VALID.items() if k != "quantity"}

    response = auth_client.post(URL, payload, format="json")

    assert response.status_code == 201
    assert response.data["quantity"] == 0


@pytest.mark.parametrize(
    "bad_field, bad_value",
    [
        ("price", "-10"),
        ("price", "cheap"),
        ("quantity", -1),
        ("make", ""),
    ],
)
def test_invalid_vehicle_data_is_rejected(auth_client, bad_field, bad_value):
    response = auth_client.post(URL, {**VALID, bad_field: bad_value}, format="json")

    assert response.status_code == 400
    assert bad_field in response.data
    assert Vehicle.objects.count() == 0


@pytest.mark.parametrize("missing", ["make", "model", "category", "price"])
def test_required_fields_must_be_present(auth_client, missing):
    payload = {k: v for k, v in VALID.items() if k != missing}

    response = auth_client.post(URL, payload, format="json")

    assert response.status_code == 400
    assert missing in response.data


def test_a_single_vehicle_can_be_fetched(auth_client):
    car = VehicleFactory()

    response = auth_client.get(f"{URL}/{car.id}")

    assert response.status_code == 200
    assert response.data["id"] == car.id


def test_fetching_an_unknown_vehicle_returns_404(auth_client):
    assert auth_client.get(f"{URL}/999999").status_code == 404
