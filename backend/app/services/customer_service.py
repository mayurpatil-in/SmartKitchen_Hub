from app.repositories import CustomerRepository
from app.models.customer import Customer
from app.middleware.error_handler import APIException

class CustomerService:
    """Service layer governing customer account operations."""
    def __init__(self):
        self.customer_repo = CustomerRepository()

    def get_customer(self, customer_id):
        """Fetches a single customer, raising 404 if missing."""
        customer = self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise APIException("Customer profile not found.", status_code=404)
        return customer

    def get_all_customers(self):
        """Fetches all customer records."""
        return self.customer_repo.get_all()

    def search_customers(self, search_query=None, page=1, per_page=10):
        """Retrieves paginated customer query matches."""
        return self.customer_repo.search_and_filter(
            search_query=search_query, 
            page=page, 
            per_page=per_page
        )

    def get_customer_by_user_id(self, user_id):
        """Retrieves a customer profile mapped to a specific user login."""
        return self.customer_repo.get_by_user_id(user_id)

    def create_customer(self, company_name, contact_person, phone, address, user_id=None):
        """Registers a new Customer profile in the directory."""
        customer = Customer(
            company_name=company_name,
            contact_person=contact_person,
            phone=phone,
            address=address,
            user_id=user_id
        )
        return self.customer_repo.create(customer)

    def update_customer(self, customer_id, **kwargs):
        """Updates fields of an existing B2B customer contact profile."""
        customer = self.get_customer(customer_id)
        
        for key, value in kwargs.items():
            if hasattr(customer, key) and value is not None:
                setattr(customer, key, value)
                
        return self.customer_repo.update(customer)

    def delete_customer(self, customer_id):
        """Deletes a customer account profile."""
        customer = self.get_customer(customer_id)
        return self.customer_repo.delete(customer)
class CustomerService:
    """Service layer governing customer account operations."""
    def __init__(self):
        self.customer_repo = CustomerRepository()

    def get_customer(self, customer_id):
        """Fetches a single customer, raising 404 if missing."""
        customer = self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise APIException("Customer profile not found.", status_code=404)
        return customer

    def get_all_customers(self):
        """Fetches all customer records."""
        return self.customer_repo.get_all()

    def search_customers(self, search_query=None, page=1, per_page=10):
        """Retrieves paginated customer query matches."""
        return self.customer_repo.search_and_filter(
            search_query=search_query, 
            page=page, 
            per_page=per_page
        )

    def get_customer_by_user_id(self, user_id):
        """Retrieves a customer profile mapped to a specific user login."""
        return self.customer_repo.get_by_user_id(user_id)

    def create_customer(self, company_name, contact_person, phone, address, user_id=None):
        """Registers a new Customer profile in the directory."""
        customer = Customer(
            company_name=company_name,
            contact_person=contact_person,
            phone=phone,
            address=address,
            user_id=user_id
        )
        return self.customer_repo.create(customer)

    def update_customer(self, customer_id, **kwargs):
        """Updates fields of an existing B2B customer contact profile."""
        customer = self.get_customer(customer_id)
        
        for key, value in kwargs.items():
            if hasattr(customer, key) and value is not None:
                setattr(customer, key, value)
                
        return self.customer_repo.update(customer)

    def delete_customer(self, customer_id):
        """Deletes a customer account profile."""
        customer = self.get_customer(customer_id)
        return self.customer_repo.delete(customer)
