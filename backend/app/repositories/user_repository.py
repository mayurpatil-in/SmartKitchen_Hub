from app.repositories.base_repository import BaseRepository
from app.models.user import User
from app.models.role import Role

class UserRepository(BaseRepository):
    """Repository handling User operations."""
    model = User

    def get_by_email(self, email):
        """Finds a user profile by their registered email string."""
        return self.model.query.filter_by(email=email).first()

    def get_role_by_name(self, name):
        """Finds a Role record by its name (e.g. 'Admin')."""
        return Role.query.filter_by(name=name).first()
        
    def get_all_roles(self):
        """Retrieves all roles in the system."""
        return Role.query.all()
