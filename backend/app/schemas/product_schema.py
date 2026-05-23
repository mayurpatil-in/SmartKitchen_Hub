from marshmallow import Schema, fields, validate

class CategorySchema(Schema):
    """Validation schema for product categories."""
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    description = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class ProductSchema(Schema):
    """Validation schema for product data."""
    id = fields.Int(dump_only=True)
    sku = fields.Str(required=True, validate=validate.Length(min=2, max=50))
    name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    description = fields.Str(allow_none=True)
    price = fields.Decimal(required=True, as_string=True)
    stock_quantity = fields.Int(required=True, validate=validate.Range(min=0))
    category_id = fields.Int(required=True)
    category_name = fields.Function(lambda obj: obj.category.name if obj.category else None, dump_only=True)
    specifications = fields.Dict(keys=fields.Str(), values=fields.Str(), allow_none=True)
    images = fields.List(fields.Str(), allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
