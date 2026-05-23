from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services import InventoryService
from app.schemas import InventoryTransactionSchema, InventoryAdjustSchema
from app.middleware.auth_middleware import role_required

class InventoryController:
    """Controller handling warehouse stock logs and manual edits."""
    def __init__(self):
        self.inventory_service = InventoryService()
        self.tx_schema = InventoryTransactionSchema()
        self.txs_schema = InventoryTransactionSchema(many=True)
        self.adjust_schema = InventoryAdjustSchema()

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def get_transactions(self):
        """Chronologically registers and filters stock counts across the organization."""
        product_id = request.args.get("product_id", type=int)
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 15, type=int)
        
        if product_id:
            pagination = self.inventory_service.get_product_transactions(product_id, page=page, per_page=per_page)
        else:
            pagination = self.inventory_service.get_all_transactions(page=page, per_page=per_page)
            
        return jsonify({
            "success": True,
            "data": {
                "items": self.txs_schema.dump(pagination.items),
                "total": pagination.total,
                "pages": pagination.pages,
                "page": pagination.page,
                "per_page": pagination.per_page
            }
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def adjust(self, product_id):
        """Allows manual edits to stock parameters (Admin and Sales Managers only)."""
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        errors = self.adjust_schema.validate(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        tx = self.inventory_service.log_adjustment(
            product_id=product_id,
            quantity=data.get("quantity"),
            reference=data.get("reference"),
            created_by_id=user_id
        )
        
        return jsonify({
            "success": True,
            "message": "Stock adjusted successfully.",
            "data": self.tx_schema.dump(tx)
        }), 200
