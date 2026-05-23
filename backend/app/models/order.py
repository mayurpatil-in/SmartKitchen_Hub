from app.extensions import db
from app.models.mixins import TimestampMixin

class Order(db.Model, TimestampMixin):
    """Database model for customer orders."""
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    quotation_id = db.Column(db.Integer, db.ForeignKey('quotations.id'), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(30), default='Pending', nullable=False)  # Pending, Processing, Shipped, Delivered, Cancelled
    delivery_status = db.Column(db.String(30), default='Pending', nullable=False)  # Pending, In Transit, Delivered
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    shipping_address = db.Column(db.Text, nullable=False)
    
    customer = db.relationship('Customer', back_populates='orders')
    quotation = db.relationship('Quotation', back_populates='order')
    creator = db.relationship('User')
    items = db.relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Order {self.order_number} - Status: {self.status}>"


class OrderItem(db.Model):
    """Database model for individual items in an Order."""
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)
    total_price = db.Column(db.Numeric(12, 2), nullable=False)
    
    order = db.relationship('Order', back_populates='items')
    product = db.relationship('Product', back_populates='order_items')

    def __repr__(self):
        return f"<OrderItem ProductID: {self.product_id} Qty: {self.quantity}>"
