from flask import Blueprint
from app.controllers.inventory_controller import InventoryController

inventory_bp = Blueprint("inventory", __name__)
inventory_controller = InventoryController()

@inventory_bp.route("/transactions", methods=["GET"])
def get_transactions():
    """Queries warehouse audit log history."""
    return inventory_controller.get_transactions()

@inventory_bp.route("/adjust/<int:product_id>", methods=["POST"])
def adjust(product_id):
    """Saves a physical adjustment adjustment to stock."""
    return inventory_controller.adjust(product_id)
