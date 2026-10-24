from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class Vehicle(models.Model):
    """A car model the dealership stocks, with its current quantity in stock."""

    make = models.CharField(max_length=60)
    model = models.CharField(max_length=60)
    category = models.CharField(max_length=40)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    # PositiveIntegerField: the database itself refuses a negative stock level.
    quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["make", "model", "id"]
        constraints = [
            models.CheckConstraint(condition=Q(price__gte=0), name="vehicle_price_non_negative"),
        ]

    def __str__(self) -> str:
        return f"{self.make} {self.model}"
