from flask import request, jsonify
from flask_jwt_extended import jwt_required
from app.services import ProductService
from app.schemas import ProductSchema, CategorySchema
from app.middleware.auth_middleware import admin_required, role_required
from decimal import Decimal

class ProductController:
    """Controller handling catalog equipment and category operations."""
    def __init__(self):
        self.product_service = ProductService()
        self.product_schema = ProductSchema()
        self.products_schema = ProductSchema(many=True)
        self.category_schema = CategorySchema()
        self.categories_schema = CategorySchema(many=True)

    def get_products(self):
        """Fetches a paginated, filterable grid of commercial equipment."""
        search = request.args.get("search")
        category_id = request.args.get("category_id", type=int)
        min_price = request.args.get("min_price", type=float)
        max_price = request.args.get("max_price", type=float)
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 12, type=int)
        
        pagination = self.product_service.search_products(
            search_query=search,
            category_id=category_id,
            min_price=min_price,
            max_price=max_price,
            page=page,
            per_page=per_page
        )
        
        return jsonify({
            "success": True,
            "data": {
                "items": self.products_schema.dump(pagination.items),
                "total": pagination.total,
                "pages": pagination.pages,
                "page": pagination.page,
                "per_page": pagination.per_page,
                "has_prev": pagination.has_prev,
                "has_next": pagination.has_next
            }
        }), 200

    def get_product(self, product_id):
        """Fetches a single kitchen equipment item by ID."""
        product = self.product_service.get_product(product_id)
        return jsonify({
            "success": True,
            "data": self.product_schema.dump(product)
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def create(self):
        """Registers a new kitchen equipment catalog profile."""
        data = request.get_json() or {}
        errors = self.product_schema.validate(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        product = self.product_service.create_product(
            sku=data.get("sku"),
            name=data.get("name"),
            price=Decimal(str(data.get("price"))),
            stock_quantity=data.get("stock_quantity"),
            category_id=data.get("category_id"),
            description=data.get("description"),
            specifications=data.get("specifications"),
            images=data.get("images")
        )
        return jsonify({
            "success": True,
            "message": "Product created successfully.",
            "data": self.product_schema.dump(product)
        }), 201

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def update(self, product_id):
        """Edits fields on an existing product profile."""
        data = request.get_json() or {}
        # Partial validation for patch updates
        errors = self.product_schema.validate(data, partial=True)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        product = self.product_service.update_product(product_id, **data)
        return jsonify({
            "success": True,
            "message": "Product updated successfully.",
            "data": self.product_schema.dump(product)
        }), 200

    @jwt_required()
    @role_required("Admin")
    def delete(self, product_id):
        """Deletes a product record (Admin only)."""
        self.product_service.delete_product(product_id)
        return jsonify({
            "success": True,
            "message": "Product deleted successfully."
        }), 200

    def get_categories(self):
        """Fetches all product categories."""
        categories = self.product_service.get_categories()
        return jsonify({
            "success": True,
            "data": self.categories_schema.dump(categories)
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def create_category(self):
        """Creates a new catalog categorization (e.g. Refrigerators)."""
        data = request.get_json() or {}
        errors = self.category_schema.validate(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        category = self.product_service.create_category(
            name=data.get("name"),
            description=data.get("description")
        )
        return jsonify({
            "success": True,
            "message": "Category created successfully.",
            "data": self.category_schema.dump(category)
        }), 201
