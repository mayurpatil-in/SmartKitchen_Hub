from flask import Blueprint
from app.controllers.product_controller import ProductController

products_bp = Blueprint("products", __name__)
product_controller = ProductController()

@products_bp.route("", methods=["GET"])
def get_products():
    """Queries kitchen equipment list."""
    return product_controller.get_products()

@products_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    """Queries details of a single product."""
    return product_controller.get_product(product_id)

@products_bp.route("", methods=["POST"])
def create_product():
    """Adds a new equipment product profile."""
    return product_controller.create()

@products_bp.route("/<int:product_id>", methods=["PUT", "PATCH"])
def update_product(product_id):
    """Modifies equipment specs or pricing."""
    return product_controller.update(product_id)

@products_bp.route("/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    """Removes a product profile."""
    return product_controller.delete(product_id)

@products_bp.route("/categories", methods=["GET"])
def get_categories():
    """Queries product categories list."""
    return product_controller.get_categories()

@products_bp.route("/categories", methods=["POST"])
def create_category():
    """Adds a category classification (e.g. Refrigerators)."""
    return product_controller.create_category()
