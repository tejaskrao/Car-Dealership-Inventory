from django.urls import path

from .views import VehicleDetailView, VehicleListCreateView, VehicleSearchView

urlpatterns = [
    path("vehicles", VehicleListCreateView.as_view(), name="vehicle-list"),
    path("vehicles/search", VehicleSearchView.as_view(), name="vehicle-search"),
    path("vehicles/<int:pk>", VehicleDetailView.as_view(), name="vehicle-detail"),
]
