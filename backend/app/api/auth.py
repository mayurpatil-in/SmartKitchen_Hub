from flask import Blueprint
from app.controllers.auth_controller import AuthController

auth_bp = Blueprint("auth", __name__)
auth_controller = AuthController()

@auth_bp.route("/login", methods=["POST"])
def login():
    """Endpoint for user login."""
    return auth_controller.login()

@auth_bp.route("/register", methods=["POST"])
def register():
    """Endpoint for registering users."""
    return auth_controller.register()

@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """Endpoint for refreshing JWT tokens."""
    return auth_controller.refresh()

@auth_bp.route("/me", methods=["GET"])
def me():
    """Endpoint to retrieve verified user details."""
    return auth_controller.me()

@auth_bp.route("/profile", methods=["PUT"])
def update_profile():
    """Endpoint to allow authenticated users to edit their profile."""
    return auth_controller.update_profile()
