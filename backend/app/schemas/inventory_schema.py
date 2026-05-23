from marshmallow import Schema, fields, validate

class InventoryTransactionSchema(Schema):
    """Validation schema for inventory logs."""
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    product_name = fields.Function(lambda obj: obj.product.name if obj.product else None, dump_only=True)
    product_sku = fields.Function(lambda obj: obj.product.sku if obj.product else None, dump_only=True)
    transaction_type = fields.Str(required=True, validate=validate.OneOf(["IN", "OUT", "ADJUST"]))
    quantity = fields.Int(required=True)
    reference = fields.Str(allow_none=True)
    created_by_id = fields.Int(dump_only=True)
    creator_name = fields.Function(lambda obj: f"{obj.creator.first_name} {obj.creator.last_name}" if obj.creator else None, dump_only=True)
    created_at = fields.DateTime(dump_only=True)

class InventoryAdjustSchema(Schema):
    """Validation schema for incoming stock adjust operations."""
    quantity = fields.Int(required=True)
    reference = fields.Str(required=True, validate=validate.Length(min=2, max=100))
