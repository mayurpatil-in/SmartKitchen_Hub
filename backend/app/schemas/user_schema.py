from marshmallow import Schema, fields, validate

class UserSchema(Schema):
    """Schema representing user data returned to clients."""
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True, validate=validate.Length(max=120))
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    role_id = fields.Int(required=True)
    role_name = fields.Function(lambda obj: obj.role.name if obj.role else None, dump_only=True)
    is_active = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class UserCreateSchema(UserSchema):
    """Schema validation for new user creation requests."""
    password = fields.Str(required=True, validate=validate.Length(min=6, max=100))

class LoginSchema(Schema):
    """Schema validation for user login requests."""
    email = fields.Email(required=True)
    password = fields.Str(required=True)
