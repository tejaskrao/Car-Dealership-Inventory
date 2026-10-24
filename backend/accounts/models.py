from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Application user. Extended in a later commit with a role (user / admin)."""
