from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import OrderService
from app.schemas import OrderSchema
from app.middleware.auth_middleware import role_required

class OrderController:
    """Controller handling B2B order checkout and status flows."""
    def __init__(self):
        self.order_service = OrderService()
        self.order_schema = OrderSchema()
        self.orders_schema = OrderSchema(many=True)

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def get_orders(self):
        """Queries historical orders with status or customer filters."""
        status = request.args.get("status")
        customer_id = request.args.get("customer_id", type=int)
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        
        pagination = self.order_service.search_orders(
            status=status, 
            customer_id=customer_id, 
            page=page, 
            per_page=per_page
        )
        
        return jsonify({
            "success": True,
            "data": {
                "items": self.orders_schema.dump(pagination.items),
                "total": pagination.total,
                "pages": pagination.pages,
                "page": pagination.page,
                "per_page": pagination.per_page
            }
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager", "Customer")
    def get_order(self, order_id):
        """Fetches details of a single order, checking user permissions."""
        order = self.order_service.get_order(order_id)
        claims = get_jwt()
        
        if claims.get("role") == "Customer":
            user_id = int(get_jwt_identity())
            if not order.customer or order.customer.user_id != user_id:
                return jsonify({"success": False, "message": "Access denied."}), 403
                
        return jsonify({
            "success": True,
            "data": self.order_schema.dump(order)
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def create(self):
        """Places a direct purchase order, verifying and deducting warehouse stock."""
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        errors = self.order_schema.validate(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        order = self.order_service.create_order(
            created_by_id=user_id,
            customer_id=data.get("customer_id"),
            shipping_address=data.get("shipping_address"),
            items=data.get("items"),
            quotation_id=data.get("quotation_id")
        )
        
        return jsonify({
            "success": True,
            "message": "Order created successfully.",
            "data": self.order_schema.dump(order)
        }), 201

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def convert_quotation(self):
        """Transitions an approved B2B quotation directly into a shipping purchase order."""
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        quotation_id = data.get("quotation_id")
        shipping_address = data.get("shipping_address")
        
        if not quotation_id or not shipping_address:
            return jsonify({
                "success": False, 
                "message": "Both 'quotation_id' and 'shipping_address' are required fields."
            }), 400
            
        order = self.order_service.convert_quotation_to_order(
            quotation_id=quotation_id,
            created_by_id=user_id,
            shipping_address=shipping_address
        )
        
        return jsonify({
            "success": True,
            "message": "Quotation successfully converted to Order.",
            "data": self.order_schema.dump(order)
        }), 201

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def update_status(self, order_id):
        """Progresses the workflow status of an order or details shipment updates."""
        data = request.get_json() or {}
        status = data.get("status")
        delivery_status = data.get("delivery_status")
        
        order = self.order_service.update_order_status(
            order_id=order_id,
            status=status,
            delivery_status=delivery_status
        )
        
        return jsonify({
            "success": True,
            "message": "Order status updated successfully.",
            "data": self.order_schema.dump(order)
        }), 200
