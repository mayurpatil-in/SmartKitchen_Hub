from marshmallow import Schema, fields

class NotificationSchema(Schema):
    """Validation schema for user notifications."""
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    title = fields.Str(dump_only=True)
    message = fields.Str(dump_only=True)
    is_read = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
