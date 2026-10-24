from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Validates a sign-up request. `role` is read-only so nobody can self-promote to admin."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role"]
        read_only_fields = ["id", "role"]

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data):
        # create_user hashes the password for us.
        return User.objects.create_user(**validated_data)


class UserSummarySerializer(serializers.ModelSerializer):
    """The small public view of a user that the frontend needs after login."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]
        read_only_fields = fields


class LoginSerializer(TokenObtainPairSerializer):
    """SimpleJWT login that also returns who just logged in (including their role)."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSummarySerializer(self.user).data
        return data
