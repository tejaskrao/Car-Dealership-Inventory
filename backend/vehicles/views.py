from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole

from .models import Vehicle
from .selectors import search_vehicles
from .serializers import VehicleSearchParamsSerializer, VehicleSerializer


class VehicleListCreateView(generics.ListCreateAPIView):
    """GET /api/vehicles lists every vehicle; POST /api/vehicles adds one."""

    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    pagination_class = None  # the catalogue is small; the UI filters client-side too


class VehicleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PUT / PATCH / DELETE /api/vehicles/:id (DELETE is admin-only)."""

    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAdminRole()]
        return super().get_permissions()


class VehicleSearchView(APIView):
    """GET /api/vehicles/search?make=&model=&category=&min_price=&max_price="""

    def get(self, request):
        params = VehicleSearchParamsSerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        filters = params.validated_data

        queryset = search_vehicles(filters)

        return Response(VehicleSerializer(queryset, many=True).data)
