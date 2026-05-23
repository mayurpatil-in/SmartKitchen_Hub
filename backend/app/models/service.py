from app.extensions import db
from app.models.mixins import TimestampMixin

class ServiceRequest(db.Model, TimestampMixin):
    """Database model for customer warranty, AMC, repair, and maintenance requests."""
    __tablename__ = 'service_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    service_type = db.Column(db.String(50), nullable=False)  # Warranty, AMC, Repair, Maintenance
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='Pending', nullable=False)  # Pending, Assigned, In Progress, Completed, Cancelled
    scheduled_date = db.Column(db.DateTime, nullable=True)
    technician_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Links to user with "Technician" role
    resolution_notes = db.Column(db.Text, nullable=True)
    
    customer = db.relationship('Customer', back_populates='service_requests')
    product = db.relationship('Product', back_populates='service_requests')
    technician = db.relationship('User', foreign_keys=[technician_id])

    def __repr__(self):
        return f"<ServiceRequest {self.title} - Status: {self.status}>"
