from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Create an admin user (or promote an existing user to admin). Safe to run repeatedly."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True)
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)

    def handle(self, *args, username, email, password, **options):
        account, created = User.objects.get_or_create(username=username, defaults={"email": email})
        account.email = email
        account.role = User.Role.ADMIN
        account.set_password(password)
        account.save()
        self.stdout.write(self.style.SUCCESS(f"Admin '{username}' {'created' if created else 'updated'}."))
