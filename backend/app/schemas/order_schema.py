from marshmallow import Schema, fields, validate

class OrderItemSchema(Schema):
    """Validation schema for order line items."""
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    product_name = fields.Function(lambda obj: obj.product.name if obj.product else None, dump_only=True)
    product_sku = fields.Function(lambda obj: obj.product.sku if obj.product else None, dump_only=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    unit_price = fields.Decimal(required=True, as_string=True)
    total_price = fields.Decimal(dump_only=True, as_string=True)

class OrderSchema(Schema):
    """Validation schema for customer orders."""
    id = fields.Int(dump_only=True)
    order_number = fields.Str(dump_only=True)
    customer_id = fields.Int(required=True)
    customer_name = fields.Function(lambda obj: obj.customer.company_name if obj.customer else None, dump_only=True)
    quotation_id = fields.Int(allow_none=True)
    created_by_id = fields.Int(dump_only=True)
    creator_name = fields.Function(lambda obj: f"{obj.creator.first_name} {obj.creator.last_name}" if obj.creator else None, dump_only=True)
    status = fields.Str(allow_none=True)  # Pending, Processing, Shipped, Delivered, Cancelled
    delivery_status = fields.Str(allow_none=True)  # Pending, In Transit, Delivered
    total_amount = fields.Decimal(dump_only=True, as_string=True)
    shipping_address = fields.Str(required=True, validate=validate.Length(min=5))
    items = fields.List(fields.Nested(OrderItemSchema), required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
