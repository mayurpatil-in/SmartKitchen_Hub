from app.models.role import Role
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.customer import Customer
from app.models.quotation import Quotation, QuotationItem
from app.models.order import Order, OrderItem
from app.models.inventory import InventoryTransaction
from app.models.service import ServiceRequest
from app.models.notification import Notification

# Expose models for migrations and direct imports
__all__ = [
    'Role',
    'User',
    'Category',
    'Product',
    'Customer',
    'Quotation',
    'QuotationItem',
    'Order',
    'OrderItem',
    'InventoryTransaction',
    'ServiceRequest',
    'Notification'
]
