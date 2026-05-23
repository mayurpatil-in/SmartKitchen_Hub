from datetime import datetime
from app.extensions import db

class TimestampMixin:
    """Mixin to automatically add created_at and updated_at audit columns."""
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
