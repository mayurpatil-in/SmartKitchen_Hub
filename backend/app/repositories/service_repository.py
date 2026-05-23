from app.repositories.base_repository import BaseRepository
from app.models.service import ServiceRequest

class ServiceRepository(BaseRepository):
    """Repository handling B2B maintenance and repair schedules."""
    model = ServiceRequest

    def get_by_technician_id(self, technician_id, status=None, page=1, per_page=10):
        """Fetches service calls assigned to a single technician."""
        query = self.model.query.filter_by(technician_id=technician_id)
        
        if status:
            query = query.filter(self.model.status == status)
            
        query = query.order_by(self.model.scheduled_date.asc())
        return query.paginate(page=page, per_page=per_page, error_out=False)

    def filter_and_paginate(self, status=None, customer_id=None, service_type=None, page=1, per_page=10):
        """Applies filters and returns paginated tickets."""
        query = self.model.query
        
        if status:
            query = query.filter(self.model.status == status)
            
        if customer_id:
            query = query.filter(self.model.customer_id == customer_id)
            
        if service_type:
            query = query.filter(self.model.service_type == service_type)
            
        query = query.order_by(self.model.id.desc())
        return query.paginate(page=page, per_page=per_page, error_out=False)
