import pytest
from django.core.management import call_command

from vehicles.models import Vehicle

pytestmark = pytest.mark.django_db


def test_seed_demo_data_adds_vehicles_once():
    call_command("seed_demo_data")
    first = Vehicle.objects.count()
    call_command("seed_demo_data")

    assert first >= 8
    assert Vehicle.objects.count() == first
    assert Vehicle.objects.filter(quantity=0).exists()  # at least one sold-out car to demo the disabled button
