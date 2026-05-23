from app.repositories import UserRepository
from app.middleware.error_handler import APIException
from flask_jwt_extended import create_access_token, create_refresh_token

class AuthService:
    """Service layer orchestrating authentication workflows."""
    def __init__(self):
        self.user_repo = UserRepository()

    def login(self, email, password):
        """Verifies user credentials and provisions JWT tokens."""
        user = self.user_repo.get_by_email(email)
        
        if not user or not user.is_active or not user.check_password(password):
            raise APIException("Invalid email or password", status_code=401)
            
        identity = str(user.id)
        # Add role to the JWT claims
        additional_claims = {"role": user.role.name}
        
        access_token = create_access_token(identity=identity, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=identity, additional_claims=additional_claims)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.name
            }
        }

    def register(self, email, password, first_name, last_name, role_name="Customer"):
        """Registers a new user record inside the database."""
        role = self.user_repo.get_role_by_name(role_name)
        if not role:
            raise APIException(f"Specified role '{role_name}' does not exist.", status_code=400)
            
        existing_user = self.user_repo.get_by_email(email)
        if existing_user:
            raise APIException("Email is already registered.", status_code=409)
            
        from app.models.user import User
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role_id=role.id
        )
        user.set_password(password)
        
        return self.user_repo.create(user)
        
    def refresh_user_token(self, user_id, role_name):
        """Generates a new access token from a valid refresh token."""
        additional_claims = {"role": role_name}
        return create_access_token(identity=str(user_id), additional_claims=additional_claims)
