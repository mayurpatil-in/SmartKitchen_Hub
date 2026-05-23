from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import AuthService
from app.schemas import LoginSchema, UserCreateSchema, UserSchema
from app.middleware.error_handler import APIException

class AuthController:
    """Controller handling credentials verification and token dispatches."""
    def __init__(self):
        self.auth_service = AuthService()
        self.login_schema = LoginSchema()
        self.register_schema = UserCreateSchema()
        self.user_schema = UserSchema()
        from app.schemas import UserUpdateSchema
        self.update_schema = UserUpdateSchema()

    def login(self):
        """Processes user authentication and yields access & refresh tokens."""
        data = request.get_json() or {}
        errors = self.login_schema.validate(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        result = self.auth_service.login(
            email=data.get("email"),
            password=data.get("password")
        )
        return jsonify({
            "success": True,
            "message": "Login successful.",
            "data": result
        }), 200

    def register(self):
        """Processes new user creation requests."""
        data = request.get_json() or {}
        errors = self.register_schema.validate(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        user = self.auth_service.register(
            email=data.get("email"),
            password=data.get("password"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            role_name=data.get("role_name", "Customer")
        )
        return jsonify({
            "success": True,
            "message": "User registered successfully.",
            "data": self.user_schema.dump(user)
        }), 201

    @jwt_required(refresh=True)
    def refresh(self):
        """Generates a fresh access token from an active refresh token claim."""
        user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get("role", "Customer")
        
        access_token = self.auth_service.refresh_user_token(user_id, role)
        return jsonify({
            "success": True,
            "message": "Token refreshed successfully.",
            "data": {
                "access_token": access_token
            }
        }), 200

    @jwt_required()
    def me(self):
        """Retrieves details of the currently authenticated user profile."""
        from app.repositories import UserRepository
        user_id = get_jwt_identity()
        user_repo = UserRepository()
        user = user_repo.get_by_id(int(user_id))
        
        if not user:
            raise APIException("User profile not found.", status_code=404)
            
        return jsonify({
            "success": True,
            "data": self.user_schema.dump(user)
        }), 200

    @jwt_required()
    def update_profile(self):
        """Allows authenticated users to update their personal account profile."""
        from app.repositories import UserRepository
        user_id = get_jwt_identity()
        user_repo = UserRepository()
        user = user_repo.get_by_id(int(user_id))
        
        if not user:
            raise APIException("User profile not found.", status_code=404)
            
        data = request.get_json() or {}
        errors = self.update_schema.validate(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        # Check if email is already taken by another user
        new_email = data.get("email")
        if new_email and new_email.lower() != user.email.lower():
            existing_user = user_repo.get_by_email(new_email)
            if existing_user:
                raise APIException("Email is already registered by another account.", status_code=409)
            user.email = new_email
            
        # Update names
        user.first_name = data.get("first_name")
        user.last_name = data.get("last_name")
        
        # Hash new password if supplied
        password = data.get("password")
        if password:
            user.set_password(password)
            
        # Save updates
        user_repo.update(user)
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully.",
            "data": {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role.name
                }
            }
        }), 200
