"""Shared pytest fixtures: API client, users and authenticated clients."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
PASSWORD = "S3cure-pass!"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="buyer", email="buyer@example.com", password=PASSWORD)


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="boss", email="boss@example.com", password=PASSWORD, role="admin"
    )


def _client_for(account):
    client = APIClient()
    token = RefreshToken.for_user(account).access_token
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.fixture
def auth_client(user):
    """API client authenticated as a regular user."""
    return _client_for(user)


@pytest.fixture
def admin_client(admin_user):
    """API client authenticated as an admin."""
    return _client_for(admin_user)
