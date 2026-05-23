from datetime import datetime
from app.extensions import db

class Notification(db.Model):
    """Database model for user-specific notifications and alerts."""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    user = db.relationship('User', back_populates='notifications')

    def __repr__(self):
        return f"<Notification {self.title} for User: {self.user_id}>"
