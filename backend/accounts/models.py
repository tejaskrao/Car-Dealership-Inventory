from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Application user with a simple role: a regular buyer or an admin."""

    class Role(models.TextChoices):
        USER = "user", "User"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN
