from app.repositories.base_repository import BaseRepository
from app.models.quotation import Quotation, QuotationItem

class QuotationRepository(BaseRepository):
    """Repository handling B2B Quotations and lines."""
    model = Quotation

    def get_by_number(self, quotation_number):
        """Finds a quotation by its unique code string."""
        return self.model.query.filter_by(quotation_number=quotation_number).first()

    def get_all_by_customer_id(self, customer_id):
        """Finds all quotations belonging to a specific customer."""
        return self.model.query.filter_by(customer_id=customer_id).all()

    def filter_and_paginate(self, status=None, customer_id=None, page=1, per_page=10):
        """Applies filters and returns paginated rows."""
        query = self.model.query
        
        if status:
            query = query.filter(self.model.status == status)
            
        if customer_id:
            query = query.filter(self.model.customer_id == customer_id)
            
        query = query.order_by(self.model.id.desc())
        return query.paginate(page=page, per_page=per_page, error_out=False)

    def delete_item(self, item):
        """Removes a single quotation line item."""
        from app.extensions import db
        db.session.delete(item)
        db.session.commit()
