from app.extensions import db
from app.models.mixins import TimestampMixin

class Customer(db.Model, TimestampMixin):
    """Database model for B2B kitchen equipment customers."""
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Link to a login user if active
    company_name = db.Column(db.String(150), nullable=False, index=True)
    contact_person = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    address = db.Column(db.Text, nullable=False)
    
    user = db.relationship('User', back_populates='customer')
    quotations = db.relationship('Quotation', back_populates='customer', cascade='all, delete-orphan')
    orders = db.relationship('Order', back_populates='customer', cascade='all, delete-orphan')
    service_requests = db.relationship('ServiceRequest', back_populates='customer', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Customer {self.company_name}>"
