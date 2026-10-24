"""Read-side queries for vehicles (kept out of the views so they are easy to test and reuse)."""
from django.db.models import QuerySet

from .models import Vehicle

TEXT_FILTERS = ("make", "model", "category")


def search_vehicles(filters: dict) -> QuerySet[Vehicle]:
    """Return vehicles matching every provided filter.

    Text filters (make, model, category) are case-insensitive "contains" matches;
    min_price / max_price are inclusive bounds. Missing or blank filters are ignored.
    """
    queryset = Vehicle.objects.all()
    for field in TEXT_FILTERS:
        if filters.get(field):
            queryset = queryset.filter(**{f"{field}__icontains": filters[field]})
    if filters.get("min_price") is not None:
        queryset = queryset.filter(price__gte=filters["min_price"])
    if filters.get("max_price") is not None:
        queryset = queryset.filter(price__lte=filters["max_price"])
    return queryset
