import pytest

pytestmark = pytest.mark.django_db

URL = "/api/auth/login"


def test_login_returns_access_and_refresh_tokens_and_the_user(api_client, user):
    response = api_client.post(URL, {"username": user.username, "password": "S3cure-pass!"}, format="json")

    assert response.status_code == 200
    assert response.data["access"]
    assert response.data["refresh"]
    assert response.data["user"] == {
        "id": user.id,
        "username": "buyer",
        "email": "buyer@example.com",
        "role": "user",
    }


def test_login_reports_the_admin_role(api_client, admin_user):
    response = api_client.post(URL, {"username": admin_user.username, "password": "S3cure-pass!"}, format="json")

    assert response.status_code == 200
    assert response.data["user"]["role"] == "admin"


def test_login_rejects_a_wrong_password(api_client, user):
    response = api_client.post(URL, {"username": user.username, "password": "nope"}, format="json")

    assert response.status_code == 401
    assert "access" not in response.data


def test_login_rejects_an_unknown_user(api_client):
    response = api_client.post(URL, {"username": "ghost", "password": "S3cure-pass!"}, format="json")

    assert response.status_code == 401


def test_login_requires_both_fields(api_client):
    response = api_client.post(URL, {"username": "buyer"}, format="json")

    assert response.status_code == 400
