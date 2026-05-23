from marshmallow import Schema, fields, validate

class CustomerSchema(Schema):
    """Validation schema for customer profiles."""
    id = fields.Int(dump_only=True)
    user_id = fields.Int(allow_none=True)
    company_name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    contact_person = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    phone = fields.Str(required=True, validate=validate.Length(min=5, max=30))
    address = fields.Str(required=True, validate=validate.Length(min=5))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
