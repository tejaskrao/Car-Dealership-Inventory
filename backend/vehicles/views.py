from rest_framework import generics, status
from rest_framework.exceptions import APIException, NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole

from .models import Vehicle
from .selectors import search_vehicles
from .serializers import PurchaseSerializer, QuantitySerializer, VehicleSearchParamsSerializer, VehicleSerializer
from .services import InsufficientStock, VehicleNotFound, purchase_vehicle, restock_vehicle


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


class StockConflict(APIException):
    """HTTP 409: the request is valid but conflicts with the current stock level."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Not enough stock to complete this request."
    default_code = "insufficient_stock"


class VehiclePurchaseView(APIView):
    """POST /api/vehicles/:id/purchase  {quantity?: int}  - sells units, decreasing stock."""

    def post(self, request, pk: int):
        body = PurchaseSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            vehicle = purchase_vehicle(pk, body.validated_data["quantity"])
        except VehicleNotFound as exc:
            raise NotFound(str(exc)) from exc
        except InsufficientStock as exc:
            raise StockConflict(str(exc)) from exc
        return Response(VehicleSerializer(vehicle).data)


class VehicleRestockView(APIView):
    """POST /api/vehicles/:id/restock  {quantity: int}  - admin only, increases stock."""

    permission_classes = [IsAdminRole]

    def post(self, request, pk: int):
        body = QuantitySerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            vehicle = restock_vehicle(pk, body.validated_data["quantity"])
        except VehicleNotFound as exc:
            raise NotFound(str(exc)) from exc
        return Response(VehicleSerializer(vehicle).data)
