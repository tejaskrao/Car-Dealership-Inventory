"""Business rules that change stock levels.

Views stay thin and call these functions. Stock changes are done with a single
conditional UPDATE so the database enforces the rule atomically: two buyers can
never both take the last unit, even under concurrent requests.
"""
from django.db.models import F

from .models import Vehicle


class VehicleNotFound(Exception):
    """No vehicle exists with the given id."""


class InvalidQuantity(ValueError):
    """The requested quantity is not a positive whole number."""


class InsufficientStock(Exception):
    """There are not enough units in stock to complete the purchase."""

    def __init__(self, available: int, requested: int):
        self.available = available
        self.requested = requested
        super().__init__(f"Only {available} unit(s) in stock, {requested} requested.")


def _require_positive(quantity: int) -> None:
    if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity < 1:
        raise InvalidQuantity("Quantity must be a positive whole number.")


def _get_or_raise(vehicle_id: int) -> Vehicle:
    try:
        return Vehicle.objects.get(pk=vehicle_id)
    except Vehicle.DoesNotExist as exc:
        raise VehicleNotFound(f"Vehicle {vehicle_id} not found.") from exc


def purchase_vehicle(vehicle_id: int, quantity: int = 1) -> Vehicle:
    """Sell `quantity` units, decreasing the stock. Raises InsufficientStock if not enough."""
    _require_positive(quantity)

    # Atomic: the WHERE clause and the decrement happen in one statement.
    updated = Vehicle.objects.filter(pk=vehicle_id, quantity__gte=quantity).update(
        quantity=F("quantity") - quantity
    )
    if updated == 0:
        vehicle = _get_or_raise(vehicle_id)  # 404 if it never existed
        raise InsufficientStock(available=vehicle.quantity, requested=quantity)

    return Vehicle.objects.get(pk=vehicle_id)


def restock_vehicle(vehicle_id: int, quantity: int) -> Vehicle:
    """Add `quantity` units to the stock."""
    _require_positive(quantity)

    updated = Vehicle.objects.filter(pk=vehicle_id).update(quantity=F("quantity") + quantity)
    if updated == 0:
        raise VehicleNotFound(f"Vehicle {vehicle_id} not found.")

    return Vehicle.objects.get(pk=vehicle_id)
