from app.repositories.base_repository import BaseRepository
from app.models.customer import Customer

class CustomerRepository(BaseRepository):
    """Repository handling Customer CRUD and searches."""
    model = Customer

    def search_and_filter(self, search_query=None, page=1, per_page=10):
        """Allows paginated search queries across company details."""
        query = self.model.query
        
        if search_query:
            pattern = f"%{search_query}%"
            query = query.filter(
                (self.model.company_name.ilike(pattern)) |
                (self.model.contact_person.ilike(pattern)) |
                (self.model.phone.ilike(pattern)) |
                (self.model.address.ilike(pattern))
            )
            
        query = query.order_by(self.model.id.desc())
        return query.paginate(page=page, per_page=per_page, error_out=False)

    def get_by_user_id(self, user_id):
        """Resolves a Customer profile linked to a particular login User."""
        return self.model.query.filter_by(user_id=user_id).first()
