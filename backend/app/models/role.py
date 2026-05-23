from app.extensions import db

class Role(db.Model):
    """Database model for user roles (Admin, Sales Manager, Customer, Technician)."""
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    
    users = db.relationship('User', back_populates='role', lazy=True)

    def __repr__(self):
        return f"<Role {self.name}>"
