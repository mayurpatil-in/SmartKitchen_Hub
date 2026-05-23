from marshmallow import Schema, fields, validate

class ServiceRequestSchema(Schema):
    """Validation schema for service requests."""
    id = fields.Int(dump_only=True)
    customer_id = fields.Int(required=True)
    customer_name = fields.Function(lambda obj: obj.customer.company_name if obj.customer else None, dump_only=True)
    product_id = fields.Int(allow_none=True)
    product_name = fields.Function(lambda obj: obj.product.name if obj.product else None, dump_only=True)
    service_type = fields.Str(required=True, validate=validate.OneOf(["Warranty", "AMC", "Repair", "Maintenance"]))
    title = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    description = fields.Str(required=True, validate=validate.Length(min=5))
    status = fields.Str(allow_none=True)  # Pending, Assigned, In Progress, Completed, Cancelled
    scheduled_date = fields.DateTime(allow_none=True)
    technician_id = fields.Int(allow_none=True)
    technician_name = fields.Function(lambda obj: f"{obj.technician.first_name} {obj.technician.last_name}" if obj.technician else None, dump_only=True)
    resolution_notes = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
