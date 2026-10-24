from rest_framework import generics

from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleListCreateView(generics.ListCreateAPIView):
    """GET /api/vehicles lists every vehicle; POST /api/vehicles adds one."""

    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    pagination_class = None  # the catalogue is small; the UI filters client-side too


class VehicleDetailView(generics.RetrieveAPIView):
    """GET /api/vehicles/:id"""

    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
