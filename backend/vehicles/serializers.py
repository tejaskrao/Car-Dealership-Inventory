from rest_framework import serializers

from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    """JSON representation of a vehicle. Model-level validators (price >= 0, quantity >= 0) apply."""

    class Meta:
        model = Vehicle
        fields = ["id", "make", "model", "category", "price", "quantity"]
        read_only_fields = ["id"]
        extra_kwargs = {"quantity": {"required": False}}


class VehicleSearchParamsSerializer(serializers.Serializer):
    """Validates the query string of GET /api/vehicles/search."""

    make = serializers.CharField(required=False, allow_blank=True)
    model = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    min_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, required=False)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, required=False)

    def validate(self, attrs):
        low, high = attrs.get("min_price"), attrs.get("max_price")
        if low is not None and high is not None and low > high:
            raise serializers.ValidationError("min_price cannot be greater than max_price.")
        return attrs


class QuantitySerializer(serializers.Serializer):
    """Body of the purchase and restock requests: a positive whole number of units."""

    # strict integers only: "abc", 1.5 and null are all rejected
    quantity = serializers.IntegerField(min_value=1)


class PurchaseSerializer(QuantitySerializer):
    """Purchases default to a single unit when no quantity is sent."""

    quantity = serializers.IntegerField(min_value=1, required=False, default=1)
