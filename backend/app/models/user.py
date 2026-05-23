from app.extensions import db
from app.models.mixins import TimestampMixin
import bcrypt

class User(db.Model, TimestampMixin):
    """Database model for application users."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    role = db.relationship('Role', back_populates='users')
    customer = db.relationship('Customer', back_populates='user', uselist=False)
    notifications = db.relationship('Notification', back_populates='user', cascade='all, delete-orphan')
    
    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
    def check_password(self, password):
        if not self.password_hash:
            return False
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        except Exception:
            return False

    def __repr__(self):
        return f"<User {self.email}>"
