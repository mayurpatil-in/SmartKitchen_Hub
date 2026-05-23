from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.middleware.error_handler import APIException

def role_required(*allowed_roles):
    """Decorator to restrict route access based on user role embedded in JWT claims."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")
            
            if not user_role or user_role not in allowed_roles:
                raise APIException(
                    message=f"Access denied. Requires one of these roles: {', '.join(allowed_roles)}",
                    status_code=403
                )
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required(fn):
    """Convenience decorator restricting access to only the Admin role."""
    return role_required("Admin")(fn)
