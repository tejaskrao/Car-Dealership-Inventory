from rest_framework import generics, permissions

from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import LoginSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register - public endpoint that creates a regular user."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []


class LoginView(TokenObtainPairView):
    """POST /api/auth/login - exchanges username + password for JWT access/refresh tokens."""

    serializer_class = LoginSerializer
