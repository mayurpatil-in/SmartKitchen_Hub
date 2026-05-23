from app.extensions import db
from app.models.mixins import TimestampMixin

class Category(db.Model, TimestampMixin):
    """Database model for product categories."""
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    
    products = db.relationship('Product', back_populates='category', lazy=True)

    def __repr__(self):
        return f"<Category {self.name}>"
