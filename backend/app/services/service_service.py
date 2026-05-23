from app.repositories import ServiceRepository, CustomerRepository, ProductRepository, UserRepository
from app.models.service import ServiceRequest
from app.middleware.error_handler import APIException

class ServiceService:
    """Service layer governing maintenance repair calls and AMC tracking."""
    def __init__(self):
        self.service_repo = ServiceRepository()
        self.customer_repo = CustomerRepository()
        self.product_repo = ProductRepository()
        self.user_repo = UserRepository()

    def get_service_request(self, service_id):
        """Fetches a service ticket, raising 404 if missing."""
        sr = self.service_repo.get_by_id(service_id)
        if not sr:
            raise APIException("Service request ticket not found.", status_code=404)
        return sr

    def search_service_requests(self, status=None, customer_id=None, service_type=None, page=1, per_page=10):
        """Queries tickets under paginated layouts."""
        return self.service_repo.filter_and_paginate(
            status=status,
            customer_id=customer_id,
            service_type=service_type,
            page=page,
            per_page=per_page
        )

    def get_technician_schedule(self, technician_id, status=None, page=1, per_page=10):
        """Gets paginated assignments matching a technician user."""
        return self.service_repo.get_by_technician_id(technician_id, status=status, page=page, per_page=per_page)

    def create_service_request(self, customer_id, title, description, service_type, product_id=None):
        """Registers a new servicing/warranty call ticket."""
        customer = self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise APIException("Customer account not found.", status_code=400)
            
        if product_id:
            product = self.product_repo.get_by_id(product_id)
            if not product:
                raise APIException("Equipment product not found.", status_code=400)
                
        sr = ServiceRequest(
            customer_id=customer_id,
            product_id=product_id,
            service_type=service_type,
            title=title,
            description=description,
            status="Pending"
        )
        return self.service_repo.create(sr)

    def assign_technician(self, service_id, technician_id, scheduled_date):
        """Maps a technician to a service request ticket and sets a datetime."""
        sr = self.get_service_request(service_id)
        
        tech = self.user_repo.get_by_id(technician_id)
        if not tech or tech.role.name != "Technician":
            raise APIException("Specified user is not registered as a Technician.", status_code=400)
            
        sr.technician_id = technician_id
        sr.scheduled_date = scheduled_date
        sr.status = "Assigned"
        
        return self.service_repo.update(sr)

    def update_resolution(self, service_id, status, resolution_notes=None):
        """Closes or transitions a service request, adding technical audit notes."""
        sr = self.get_service_request(service_id)
        
        if status not in ["In Progress", "Completed", "Cancelled"]:
            raise APIException("Invalid status transition for service ticket.", status_code=400)
            
        sr.status = status
        if resolution_notes:
            sr.resolution_notes = resolution_notes
            
        return self.service_repo.update(sr)
