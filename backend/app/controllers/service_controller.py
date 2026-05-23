from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import ServiceService, CustomerService
from app.schemas import ServiceRequestSchema
from app.middleware.auth_middleware import role_required
from app.middleware.error_handler import APIException
import datetime

class ServiceController:
    """Controller handling warranty claims and maintenance scheduling requests."""
    def __init__(self):
        self.service_service = ServiceService()
        self.customer_service = CustomerService()
        self.sr_schema = ServiceRequestSchema()
        self.srs_schema = ServiceRequestSchema(many=True)

    @jwt_required()
    @role_required("Admin", "Sales Manager", "Technician", "Customer")
    def get_requests(self):
        """Fetches servicing requests matching role scope with filter options."""
        claims = get_jwt()
        user_role = claims.get("role")
        user_id = int(get_jwt_identity())
        
        status = request.args.get("status")
        service_type = request.args.get("service_type")
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        
        if user_role == "Technician":
            pagination = self.service_service.get_technician_schedule(
                user_id, status=status, page=page, per_page=per_page
            )
        elif user_role == "Customer":
            cust = self.customer_service.get_customer_by_user_id(user_id)
            if not cust:
                return jsonify({
                    "success": True,
                    "data": {"items": [], "total": 0, "pages": 0, "page": 1, "per_page": per_page}
                }), 200
            pagination = self.service_service.search_service_requests(
                status=status, customer_id=cust.id, service_type=service_type, page=page, per_page=per_page
            )
        else:
            customer_id = request.args.get("customer_id", type=int)
            pagination = self.service_service.search_service_requests(
                status=status, customer_id=customer_id, service_type=service_type, page=page, per_page=per_page
            )
            
        return jsonify({
            "success": True,
            "data": {
                "items": self.srs_schema.dump(pagination.items),
                "total": pagination.total,
                "pages": pagination.pages,
                "page": pagination.page,
                "per_page": pagination.per_page
            }
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager", "Customer")
    def create(self):
        """Registers a new warranty repair call ticket."""
        claims = get_jwt()
        user_role = claims.get("role")
        user_id = int(get_jwt_identity())
        
        data = request.get_json() or {}
        errors = self.sr_schema.validate(data, partial=True)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        customer_id = data.get("customer_id")
        if user_role == "Customer":
            cust = self.customer_service.get_customer_by_user_id(user_id)
            if not cust:
                raise APIException("No customer account profile linked to user login.", status_code=403)
            customer_id = cust.id
            
        sr = self.service_service.create_service_request(
            customer_id=customer_id,
            title=data.get("title"),
            description=data.get("description"),
            service_type=data.get("service_type"),
            product_id=data.get("product_id")
        )
        
        return jsonify({
            "success": True,
            "message": "Service ticket opened successfully.",
            "data": self.sr_schema.dump(sr)
        }), 201

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def assign(self, service_id):
        """Assigns a technician user and details scheduling parameters."""
        data = request.get_json() or {}
        technician_id = data.get("technician_id")
        scheduled_date_str = data.get("scheduled_date")
        
        if not technician_id or not scheduled_date_str:
            return jsonify({
                "success": False, 
                "message": "'technician_id' and 'scheduled_date' are required request elements."
            }), 400
            
        try:
            # ISO date parses
            scheduled_date = datetime.datetime.fromisoformat(scheduled_date_str.replace("Z", "+00:00"))
        except Exception:
            try:
                scheduled_date = datetime.datetime.strptime(scheduled_date_str.split(".")[0], "%Y-%m-%dT%H:%M:%S")
            except Exception:
                return jsonify({"success": False, "message": "Invalid scheduled_date ISO-8601 formatting."}), 422
                
        sr = self.service_service.assign_technician(
            service_id=service_id,
            technician_id=technician_id,
            scheduled_date=scheduled_date
        )
        
        return jsonify({
            "success": True,
            "message": "Technician mapped and calendar scheduled.",
            "data": self.sr_schema.dump(sr)
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager", "Technician")
    def update_resolution(self, service_id):
        """Updates work resolution notes and toggles service state (e.g. Completed)."""
        data = request.get_json() or {}
        status = data.get("status")
        resolution_notes = data.get("resolution_notes")
        
        sr = self.service_service.update_resolution(
            service_id=service_id,
            status=status,
            resolution_notes=resolution_notes
        )
        
        return jsonify({
            "success": True,
            "message": "Service resolution updated successfully.",
            "data": self.sr_schema.dump(sr)
        }), 200
