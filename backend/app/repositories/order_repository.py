from app.repositories.base_repository import BaseRepository
from app.models.order import Order

class OrderRepository(BaseRepository):
    """Repository handling B2B Order records."""
    model = Order

    def get_by_number(self, order_number):
        """Finds an order record by its unique identifier."""
        return self.model.query.filter_by(order_number=order_number).first()

    def get_all_by_customer_id(self, customer_id):
        """Finds all orders belonging to a specific customer."""
        return self.model.query.filter_by(customer_id=customer_id).all()

    def filter_and_paginate(self, status=None, customer_id=None, page=1, per_page=10):
        """Filters orders and returns a paginated dataset."""
        query = self.model.query
        
        if status:
            query = query.filter(self.model.status == status)
            
        if customer_id:
            query = query.filter(self.model.customer_id == customer_id)
            
        query = query.order_by(self.model.id.desc())
        return query.paginate(page=page, per_page=per_page, error_out=False)
