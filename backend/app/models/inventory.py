from datetime import datetime
from app.extensions import db

class InventoryTransaction(db.Model):
    """Database model to audit all stock modifications (IN, OUT, ADJUST)."""
    __tablename__ = 'inventory_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # IN, OUT, ADJUST
    quantity = db.Column(db.Integer, nullable=False)             # Can be positive or negative
    reference = db.Column(db.String(100), nullable=True)          # e.g., "Order #ORD-1002" or "Physical Audit"
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    product = db.relationship('Product', back_populates='inventory_transactions')
    creator = db.relationship('User')

    def __repr__(self):
        return f"<InventoryTransaction {self.transaction_type} of {self.quantity} for Product: {self.product_id}>"
