import pytest
from django.contrib.auth import get_user_model

User = get_user_model()
pytestmark = pytest.mark.django_db


def test_new_users_default_to_the_user_role():
    account = User.objects.create_user(username="a", password="S3cure-pass!")
    assert account.role == "user"
    assert account.is_admin is False


def test_admin_role_is_reported_by_is_admin():
    account = User.objects.create_user(username="b", password="S3cure-pass!", role="admin")
    assert account.is_admin is True
