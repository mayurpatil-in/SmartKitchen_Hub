from app.extensions import db
from app.models.mixins import TimestampMixin

class Quotation(db.Model, TimestampMixin):
    """Database model for B2B price proposals/quotations."""
    __tablename__ = 'quotations'
    
    id = db.Column(db.Integer, primary_key=True)
    quotation_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(30), default='Draft', nullable=False)  # Draft, Sent, Approved, Rejected
    valid_until = db.Column(db.Date, nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)
    tax = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)
    discount = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)
    total = db.Column(db.Numeric(12, 2), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    
    customer = db.relationship('Customer', back_populates='quotations')
    creator = db.relationship('User')
    items = db.relationship('QuotationItem', back_populates='quotation', cascade='all, delete-orphan')
    order = db.relationship('Order', back_populates='quotation', uselist=False)

    def __repr__(self):
        return f"<Quotation {self.quotation_number} - Status: {self.status}>"


class QuotationItem(db.Model):
    """Database model for line items in a Quotation."""
    __tablename__ = 'quotation_items'
    
    id = db.Column(db.Integer, primary_key=True)
    quotation_id = db.Column(db.Integer, db.ForeignKey('quotations.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)
    total_price = db.Column(db.Numeric(12, 2), nullable=False)
    
    quotation = db.relationship('Quotation', back_populates='items')
    product = db.relationship('Product', back_populates='quotation_items')

    def __repr__(self):
        return f"<QuotationItem ProductID: {self.product_id} Qty: {self.quantity}>"
