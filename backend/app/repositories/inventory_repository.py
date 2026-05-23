from app.repositories.base_repository import BaseRepository
from app.models.inventory import InventoryTransaction

class InventoryRepository(BaseRepository):
    """Repository handling inventory log tracking."""
    model = InventoryTransaction

    def get_by_product_id(self, product_id, page=1, per_page=10):
        """Fetches paginated transactions for a single product."""
        query = self.model.query.filter_by(product_id=product_id).order_by(self.model.id.desc())
        return query.paginate(page=page, per_page=per_page, error_out=False)

    def get_all_transactions(self, page=1, per_page=15):
        """Fetches a paginated ledger of all operations across the database."""
        query = self.model.query.order_by(self.model.id.desc())
        return query.paginate(page=page, per_page=per_page, error_out=False)
