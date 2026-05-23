from app.repositories import ProductRepository
from app.models.product import Product
from app.models.category import Category
from app.middleware.error_handler import APIException

class ProductService:
    """Service layer governing catalog equipment and category operations."""
    def __init__(self):
        self.product_repo = ProductRepository()

    def get_product(self, product_id):
        """Finds a single product record, raising 404 if missing."""
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise APIException("Product not found.", status_code=404)
        return product

    def get_all_products(self):
        """Fetches all product records."""
        return self.product_repo.get_all()

    def search_products(self, search_query=None, category_id=None, min_price=None, max_price=None, page=1, per_page=12):
        """Queries product results matching criteria."""
        return self.product_repo.search_and_filter(
            search_query=search_query,
            category_id=category_id,
            min_price=min_price,
            max_price=max_price,
            page=page,
            per_page=per_page
        )

    def create_product(self, sku, name, price, stock_quantity, category_id, description=None, specifications=None, images=None):
        """Registers a new kitchen equipment product under a validated category SKU."""
        existing_sku = self.product_repo.get_by_sku(sku)
        if existing_sku:
            raise APIException(f"Product SKU '{sku}' is already registered.", status_code=409)
            
        category = self.product_repo.get_category_by_id(category_id)
        if not category:
            raise APIException(f"Category ID '{category_id}' does not exist.", status_code=400)
            
        product = Product(
            sku=sku,
            name=name,
            price=price,
            stock_quantity=stock_quantity,
            category_id=category_id,
            description=description,
            specifications=specifications or {},
            images=images or []
        )
        return self.product_repo.create(product)

    def update_product(self, product_id, **kwargs):
        """Edits an existing equipment record, validating category references."""
        product = self.get_product(product_id)
        
        sku = kwargs.get("sku")
        if sku and sku != product.sku:
            existing_sku = self.product_repo.get_by_sku(sku)
            if existing_sku:
                raise APIException(f"SKU '{sku}' is already assigned to another item.", status_code=409)
                
        category_id = kwargs.get("category_id")
        if category_id and category_id != product.category_id:
            category = self.product_repo.get_category_by_id(category_id)
            if not category:
                raise APIException(f"Category ID '{category_id}' does not exist.", status_code=400)
                
        for key, value in kwargs.items():
            if hasattr(product, key) and value is not None:
                setattr(product, key, value)
                
        return self.product_repo.update(product)

    def delete_product(self, product_id):
        """Removes a product profile from the database."""
        product = self.get_product(product_id)
        return self.product_repo.delete(product)

    def get_categories(self):
        """Fetches all product categories."""
        return self.product_repo.get_all_categories()

    def create_category(self, name, description=None):
        """Registers a new category name."""
        existing = self.product_repo.get_category_by_name(name)
        if existing:
            raise APIException(f"Category '{name}' already exists.", status_code=409)
            
        category = Category(name=name, description=description)
        return self.product_repo.create_category(category)
