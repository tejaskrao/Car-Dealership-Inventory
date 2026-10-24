import pytest

from vehicles.tests.factories import VehicleFactory

pytestmark = pytest.mark.django_db

URL = "/api/vehicles/search"


@pytest.fixture
def fleet():
    return {
        "camry": VehicleFactory(make="Toyota", model="Camry", category="Sedan", price="28000.00"),
        "rav4": VehicleFactory(make="Toyota", model="RAV4", category="SUV", price="35000.00"),
        "civic": VehicleFactory(make="Honda", model="Civic", category="Sedan", price="22000.00"),
        "crv": VehicleFactory(make="Honda", model="CR-V", category="SUV", price="33000.00"),
        "model3": VehicleFactory(make="Tesla", model="Model 3", category="Sedan", price="45000.00", quantity=0),
    }


def models_of(response):
    return sorted(v["model"] for v in response.data)


def test_search_requires_authentication(api_client):
    assert api_client.get(URL).status_code == 401


def test_without_filters_search_returns_everything(auth_client, fleet):
    assert len(auth_client.get(URL).data) == 5


def test_filter_by_make_is_case_insensitive_and_partial(auth_client, fleet):
    assert models_of(auth_client.get(URL, {"make": "toy"})) == ["Camry", "RAV4"]


def test_filter_by_model(auth_client, fleet):
    assert models_of(auth_client.get(URL, {"model": "civ"})) == ["Civic"]


def test_filter_by_category(auth_client, fleet):
    assert models_of(auth_client.get(URL, {"category": "suv"})) == ["CR-V", "RAV4"]


def test_filter_by_minimum_price_is_inclusive(auth_client, fleet):
    assert models_of(auth_client.get(URL, {"min_price": "35000"})) == ["Model 3", "RAV4"]


def test_filter_by_maximum_price_is_inclusive(auth_client, fleet):
    assert models_of(auth_client.get(URL, {"max_price": "22000"})) == ["Civic"]


def test_filter_by_price_range(auth_client, fleet):
    response = auth_client.get(URL, {"min_price": "28000", "max_price": "35000"})

    assert models_of(response) == ["CR-V", "Camry", "RAV4"]


def test_filters_are_combined_with_and(auth_client, fleet):
    response = auth_client.get(URL, {"make": "honda", "category": "sedan", "max_price": "30000"})

    assert models_of(response) == ["Civic"]


def test_no_match_returns_an_empty_list(auth_client, fleet):
    response = auth_client.get(URL, {"make": "Ferrari"})

    assert response.status_code == 200
    assert response.data == []


def test_out_of_stock_vehicles_can_still_be_found(auth_client, fleet):
    assert models_of(auth_client.get(URL, {"make": "tesla"})) == ["Model 3"]


@pytest.mark.parametrize("params", [{"min_price": "abc"}, {"max_price": "-5"}, {"min_price": "-1"}])
def test_invalid_prices_are_rejected(auth_client, fleet, params):
    assert auth_client.get(URL, params).status_code == 400


def test_a_min_price_above_the_max_price_is_rejected(auth_client, fleet):
    response = auth_client.get(URL, {"min_price": "50000", "max_price": "10000"})

    assert response.status_code == 400


def test_blank_filters_are_ignored(auth_client, fleet):
    assert len(auth_client.get(URL, {"make": "", "category": ""}).data) == 5
