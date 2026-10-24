"""Unit tests for the stock-changing business rules (no HTTP involved)."""
import threading

import pytest
from django.db import connection

from vehicles.models import Vehicle
from vehicles.services import InsufficientStock, InvalidQuantity, VehicleNotFound, purchase_vehicle, restock_vehicle
from vehicles.tests.factories import VehicleFactory


@pytest.mark.django_db
class TestPurchase:
    def test_buys_one_unit_by_default(self):
        car = VehicleFactory(quantity=5)

        result = purchase_vehicle(car.id)

        assert result.quantity == 4
        car.refresh_from_db()
        assert car.quantity == 4

    def test_buys_the_requested_number_of_units(self):
        car = VehicleFactory(quantity=5)

        assert purchase_vehicle(car.id, 3).quantity == 2

    def test_can_buy_the_last_unit(self):
        car = VehicleFactory(quantity=1)

        assert purchase_vehicle(car.id).quantity == 0

    def test_cannot_buy_when_out_of_stock(self):
        car = VehicleFactory(quantity=0)

        with pytest.raises(InsufficientStock):
            purchase_vehicle(car.id)

    def test_cannot_buy_more_than_is_in_stock_and_stock_is_untouched(self):
        car = VehicleFactory(quantity=2)

        with pytest.raises(InsufficientStock):
            purchase_vehicle(car.id, 3)

        car.refresh_from_db()
        assert car.quantity == 2

    @pytest.mark.parametrize("bad", [0, -1])
    def test_quantity_must_be_a_positive_number(self, bad):
        car = VehicleFactory(quantity=5)

        with pytest.raises(InvalidQuantity):
            purchase_vehicle(car.id, bad)

    def test_unknown_vehicle(self):
        with pytest.raises(VehicleNotFound):
            purchase_vehicle(999999)


@pytest.mark.django_db
class TestRestock:
    def test_adds_units_to_the_stock(self):
        car = VehicleFactory(quantity=2)

        assert restock_vehicle(car.id, 10).quantity == 12

    def test_can_restock_an_out_of_stock_vehicle(self):
        car = VehicleFactory(quantity=0)

        assert restock_vehicle(car.id, 1).quantity == 1

    @pytest.mark.parametrize("bad", [0, -3])
    def test_quantity_must_be_a_positive_number(self, bad):
        car = VehicleFactory(quantity=2)

        with pytest.raises(InvalidQuantity):
            restock_vehicle(car.id, bad)

    def test_unknown_vehicle(self):
        with pytest.raises(VehicleNotFound):
            restock_vehicle(999999, 1)


@pytest.mark.django_db(transaction=True)
def test_concurrent_purchases_never_oversell_the_last_units():
    """10 buyers race for 3 cars: exactly 3 succeed and stock ends at 0 (never negative)."""
    car = VehicleFactory(quantity=3)
    outcomes = []

    def buy():
        try:
            purchase_vehicle(car.id)
            outcomes.append("sold")
        except InsufficientStock:
            outcomes.append("refused")
        finally:
            connection.close()  # each thread owns its own database connection

    threads = [threading.Thread(target=buy) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert outcomes.count("sold") == 3
    assert outcomes.count("refused") == 7
    assert Vehicle.objects.get(pk=car.pk).quantity == 0
