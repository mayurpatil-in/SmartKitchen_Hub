from app.repositories import InventoryRepository, ProductRepository
from app.models.inventory import InventoryTransaction
from app.middleware.error_handler import APIException

class InventoryService:
    """Service layer governing warehouse physical stock updates and audit logs."""
    def __init__(self):
        self.inventory_repo = InventoryRepository()
        self.product_repo = ProductRepository()

    def get_all_transactions(self, page=1, per_page=15):
        """Retrieves a chronological log of all stock changes."""
        return self.inventory_repo.get_all_transactions(page=page, per_page=per_page)

    def get_product_transactions(self, product_id, page=1, per_page=10):
        """Retrieves changes logged on a single product."""
        return self.inventory_repo.get_by_product_id(product_id, page=page, per_page=per_page)

    def log_adjustment(self, product_id, quantity, reference, created_by_id):
        """Allows manual adjustments (e.g. damages or physical audits) to product stock levels."""
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise APIException("Product not found.", status_code=404)
            
        new_stock = product.stock_quantity + quantity
        if new_stock < 0:
            raise APIException(
                message=f"Cannot adjust stock to negative quantity. Current stock: {product.stock_quantity}, requested offset: {quantity}", 
                status_code=400
            )
            
        # Update product stock
        product.stock_quantity = new_stock
        self.product_repo.update(product)
        
        # Form transaction details
        tx_type = "IN" if quantity > 0 else "ADJUST"  # ADJUST captures physical edits
        tx = InventoryTransaction(
            product_id=product_id,
            transaction_type=tx_type,
            quantity=quantity,
            reference=reference,
            created_by_id=created_by_id
        )
        
        return self.inventory_repo.create(tx)
