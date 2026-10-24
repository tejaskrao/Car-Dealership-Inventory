import pytest
from django.contrib.auth import get_user_model

User = get_user_model()
pytestmark = pytest.mark.django_db

URL = "/api/auth/register"
VALID = {"username": "newbie", "email": "newbie@example.com", "password": "S3cure-pass!"}


def test_register_creates_a_user_and_hides_the_password(api_client):
    response = api_client.post(URL, VALID, format="json")

    assert response.status_code == 201
    assert response.data["username"] == "newbie"
    assert response.data["email"] == "newbie@example.com"
    assert response.data["role"] == "user"
    assert "password" not in response.data


def test_register_stores_a_hashed_password(api_client):
    api_client.post(URL, VALID, format="json")

    stored = User.objects.get(username="newbie")
    assert stored.password != VALID["password"]
    assert stored.check_password(VALID["password"])


def test_register_does_not_allow_choosing_the_admin_role(api_client):
    response = api_client.post(URL, {**VALID, "role": "admin"}, format="json")

    assert response.status_code == 201
    assert User.objects.get(username="newbie").role == "user"


def test_register_rejects_a_duplicate_username(api_client, user):
    response = api_client.post(URL, {**VALID, "username": user.username}, format="json")

    assert response.status_code == 400
    assert "username" in response.data


def test_register_rejects_a_duplicate_email_ignoring_case(api_client, user):
    response = api_client.post(URL, {**VALID, "email": user.email.upper()}, format="json")

    assert response.status_code == 400
    assert "email" in response.data


def test_register_rejects_a_weak_password(api_client):
    response = api_client.post(URL, {**VALID, "password": "short"}, format="json")

    assert response.status_code == 400
    assert "password" in response.data


@pytest.mark.parametrize("missing", ["username", "email", "password"])
def test_register_requires_all_fields(api_client, missing):
    payload = {k: v for k, v in VALID.items() if k != missing}

    response = api_client.post(URL, payload, format="json")

    assert response.status_code == 400
    assert missing in response.data
