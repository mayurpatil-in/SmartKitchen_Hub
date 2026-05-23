from flask import Blueprint
from app.controllers.order_controller import OrderController

orders_bp = Blueprint("orders", __name__)
order_controller = OrderController()

@orders_bp.route("", methods=["GET"])
def get_orders():
    """Queries orders list."""
    return order_controller.get_orders()

@orders_bp.route("/<int:order_id>", methods=["GET"])
def get_order(order_id):
    """Queries details of a B2B order."""
    return order_controller.get_order(order_id)

@orders_bp.route("", methods=["POST"])
def create_order():
    """Builds and checks out an order directly."""
    return order_controller.create()

@orders_bp.route("/convert", methods=["POST"])
def convert_quotation():
    """Converts a drafted quote directly to a shipment purchase."""
    return order_controller.convert_quotation()

@orders_bp.route("/<int:order_id>/status", methods=["PUT"])
def update_status(order_id):
    """Updates shipping/courier progression statuses."""
    return order_controller.update_status(order_id)
