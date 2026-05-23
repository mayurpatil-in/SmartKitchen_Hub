from marshmallow import Schema, fields, validate

class QuotationItemSchema(Schema):
    """Validation schema for quotation line items."""
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    product_name = fields.Function(lambda obj: obj.product.name if obj.product else None, dump_only=True)
    product_sku = fields.Function(lambda obj: obj.product.sku if obj.product else None, dump_only=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    unit_price = fields.Decimal(required=True, as_string=True)
    total_price = fields.Decimal(dump_only=True, as_string=True)

class QuotationSchema(Schema):
    """Validation schema for quotations."""
    id = fields.Int(dump_only=True)
    quotation_number = fields.Str(dump_only=True)
    customer_id = fields.Int(required=True)
    customer_name = fields.Function(lambda obj: obj.customer.company_name if obj.customer else None, dump_only=True)
    created_by_id = fields.Int(dump_only=True)
    creator_name = fields.Function(lambda obj: f"{obj.creator.first_name} {obj.creator.last_name}" if obj.creator else None, dump_only=True)
    status = fields.Str(allow_none=True)  # Draft, Sent, Approved, Rejected
    valid_until = fields.Date(required=True)
    subtotal = fields.Decimal(dump_only=True, as_string=True)
    tax = fields.Decimal(required=True, as_string=True)
    discount = fields.Decimal(required=True, as_string=True)
    total = fields.Decimal(dump_only=True, as_string=True)
    notes = fields.Str(allow_none=True)
    items = fields.List(fields.Nested(QuotationItemSchema), required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
