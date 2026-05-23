from flask import jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from app.utils.logger import logger

class APIException(Exception):
    """Custom API Exception class for raising structured errors in controllers/services."""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['success'] = False
        return rv

def register_error_handlers(app):
    """Registers standard handlers on the Flask app context."""
    
    @app.errorhandler(APIException)
    def handle_api_exception(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        logger.warning(f"Request validation failed: {error.messages}")
        return jsonify({
            "success": False,
            "message": "Validation failed",
            "errors": error.messages
        }), 422

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        logger.error(f"Database Integrity violation: {str(error)}")
        return jsonify({
            "success": False,
            "message": "Data conflict or relationship integrity failure. E.g., item may already exist or is referenced elsewhere."
        }), 409

    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        logger.error(f"Unhandled runtime exception: {str(error)}", exc_info=True)
        return jsonify({
            "success": False,
            "message": "An unexpected system error occurred. Please try again later."
        }), 500
