from rest_framework import serializers

from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    """JSON representation of a vehicle. Model-level validators (price >= 0, quantity >= 0) apply."""

    class Meta:
        model = Vehicle
        fields = ["id", "make", "model", "category", "price", "quantity"]
        read_only_fields = ["id"]
        extra_kwargs = {"quantity": {"required": False}}
