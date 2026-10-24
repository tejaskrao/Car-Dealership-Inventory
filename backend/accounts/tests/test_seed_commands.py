import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from vehicles.models import Vehicle

User = get_user_model()
pytestmark = pytest.mark.django_db


def test_create_admin_command_creates_an_admin_who_can_log_in(api_client):
    call_command("create_admin", "--username", "owner", "--email", "owner@example.com", "--password", "S3cure-pass!")

    account = User.objects.get(username="owner")
    assert account.is_admin
    response = api_client.post("/api/auth/login", {"username": "owner", "password": "S3cure-pass!"}, format="json")
    assert response.status_code == 200


def test_create_admin_command_is_idempotent_and_promotes_an_existing_user(user):
    call_command("create_admin", "--username", user.username, "--email", user.email, "--password", "An0ther-pass!")
    call_command("create_admin", "--username", user.username, "--email", user.email, "--password", "An0ther-pass!")

    assert User.objects.filter(username=user.username).count() == 1
    user.refresh_from_db()
    assert user.is_admin
    assert user.check_password("An0ther-pass!")


def test_seed_demo_data_adds_vehicles_once():
    call_command("seed_demo_data")
    first = Vehicle.objects.count()
    call_command("seed_demo_data")

    assert first >= 8
    assert Vehicle.objects.count() == first
    assert Vehicle.objects.filter(quantity=0).exists()  # at least one sold-out car to demo the disabled button
