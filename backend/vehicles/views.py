from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Vehicle
from .serializers import VehicleSearchParamsSerializer, VehicleSerializer


class VehicleListCreateView(generics.ListCreateAPIView):
    """GET /api/vehicles lists every vehicle; POST /api/vehicles adds one."""

    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    pagination_class = None  # the catalogue is small; the UI filters client-side too


class VehicleDetailView(generics.RetrieveAPIView):
    """GET /api/vehicles/:id"""

    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer


class VehicleSearchView(APIView):
    """GET /api/vehicles/search?make=&model=&category=&min_price=&max_price="""

    def get(self, request):
        params = VehicleSearchParamsSerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        filters = params.validated_data

        queryset = Vehicle.objects.all()
        for field in ("make", "model", "category"):
            if filters.get(field):
                queryset = queryset.filter(**{f"{field}__icontains": filters[field]})
        if "min_price" in filters:
            queryset = queryset.filter(price__gte=filters["min_price"])
        if "max_price" in filters:
            queryset = queryset.filter(price__lte=filters["max_price"])

        return Response(VehicleSerializer(queryset, many=True).data)
