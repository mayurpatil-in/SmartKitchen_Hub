from flask import request, jsonify
from flask_jwt_extended import jwt_required
from app.services import CustomerService
from app.schemas import CustomerSchema
from app.middleware.auth_middleware import role_required

class CustomerController:
    """Controller handling CRM customer profiles."""
    def __init__(self):
        self.customer_service = CustomerService()
        self.customer_schema = CustomerSchema()
        self.customers_schema = CustomerSchema(many=True)

    @jwt_required()
    @role_required("Admin", "Sales Manager", "Technician")
    def get_customers(self):
        """Fetches a paginated, searchable list of customer organizations."""
        search = request.args.get("search")
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        
        pagination = self.customer_service.search_customers(search_query=search, page=page, per_page=per_page)
        
        return jsonify({
            "success": True,
            "data": {
                "items": self.customers_schema.dump(pagination.items),
                "total": pagination.total,
                "pages": pagination.pages,
                "page": pagination.page,
                "per_page": pagination.per_page
            }
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager", "Technician")
    def get_customer(self, customer_id):
        """Fetches a single CRM B2B profile."""
        customer = self.customer_service.get_customer(customer_id)
        return jsonify({
            "success": True,
            "data": self.customer_schema.dump(customer)
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def create(self):
        """Registers a new B2B customer profile."""
        data = request.get_json() or {}
        errors = self.customer_schema.validate(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        customer = self.customer_service.create_customer(
            company_name=data.get("company_name"),
            contact_person=data.get("contact_person"),
            phone=data.get("phone"),
            address=data.get("address"),
            user_id=data.get("user_id")
        )
        return jsonify({
            "success": True,
            "message": "Customer profile created successfully.",
            "data": self.customer_schema.dump(customer)
        }), 201

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def update(self, customer_id):
        """Edits profile parameters of an existing customer contact."""
        data = request.get_json() or {}
        errors = self.customer_schema.validate(data, partial=True)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        customer = self.customer_service.update_customer(customer_id, **data)
        return jsonify({
            "success": True,
            "message": "Customer profile updated successfully.",
            "data": self.customer_schema.dump(customer)
        }), 200

    @jwt_required()
    @role_required("Admin")
    def delete(self, customer_id):
        """Removes a customer profile directory entry."""
        self.customer_service.delete_customer(customer_id)
        return jsonify({
            "success": True,
            "message": "Customer profile deleted successfully."
        }), 200
