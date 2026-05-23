from flask import Blueprint
from app.controllers.customer_controller import CustomerController

customers_bp = Blueprint("customers", __name__)
customer_controller = CustomerController()

@customers_bp.route("", methods=["GET"])
def get_customers():
    """Queries customer list."""
    return customer_controller.get_customers()

@customers_bp.route("/<int:customer_id>", methods=["GET"])
def get_customer(customer_id):
    """Queries details of a B2B profile."""
    return customer_controller.get_customer(customer_id)

@customers_bp.route("", methods=["POST"])
def create_customer():
    """Adds a new B2B profile."""
    return customer_controller.create()

@customers_bp.route("/<int:customer_id>", methods=["PUT", "PATCH"])
def update_customer(customer_id):
    """Modifies contact details."""
    return customer_controller.update(customer_id)

@customers_bp.route("/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    """Removes a B2B profile."""
    return customer_controller.delete(customer_id)
