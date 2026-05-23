from app.extensions import db
from app.models.mixins import TimestampMixin

class Product(db.Model, TimestampMixin):
    """Database model for commercial kitchen equipment products."""
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    stock_quantity = db.Column(db.Integer, default=0, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    specifications = db.Column(db.JSON, nullable=True)  # Format: { "Power": "2kW", "Capacity": "10L", "Dimensions": "500x400x300mm" }
    images = db.Column(db.JSON, nullable=True)  # Format: ["/uploads/oven_front.jpg", "/uploads/oven_side.jpg"]
    
    category = db.relationship('Category', back_populates='products')
    inventory_transactions = db.relationship('InventoryTransaction', back_populates='product', cascade='all, delete-orphan')
    service_requests = db.relationship('ServiceRequest', back_populates='product', cascade='all, delete-orphan')
    quotation_items = db.relationship('QuotationItem', back_populates='product', cascade='all, delete-orphan')
    order_items = db.relationship('OrderItem', back_populates='product', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Product {self.name} (SKU: {self.sku})>"
