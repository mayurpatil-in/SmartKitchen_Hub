from app.repositories.base_repository import BaseRepository
from app.models.product import Product
from app.models.category import Category

class ProductRepository(BaseRepository):
    """Repository handling Product and Category queries."""
    model = Product

    def get_by_sku(self, sku):
        """Finds a product record by its SKU identifier."""
        return self.model.query.filter_by(sku=sku).first()

    def get_category_by_id(self, category_id):
        """Fetches a category by its ID."""
        return Category.query.get(category_id)

    def get_category_by_name(self, name):
        """Finds a Category record by name."""
        return Category.query.filter_by(name=name).first()

    def get_all_categories(self):
        """Retrieves all product categories."""
        return Category.query.all()

    def create_category(self, category):
        """Creates a new product category."""
        from app.extensions import db
        db.session.add(category)
        db.session.commit()
        return category

    def search_and_filter(self, search_query=None, category_id=None, min_price=None, max_price=None, page=1, per_page=12):
        """Performs Paginated filtering on the Product catalog."""
        query = self.model.query
        
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                (self.model.name.ilike(search_pattern)) | 
                (self.model.sku.ilike(search_pattern)) |
                (self.model.description.ilike(search_pattern))
            )
            
        if category_id:
            query = query.filter(self.model.category_id == category_id)
            
        if min_price is not None:
            query = query.filter(self.model.price >= min_price)
            
        if max_price is not None:
            query = query.filter(self.model.price <= max_price)
            
        # Standard default sorting (most recent first)
        query = query.order_by(self.model.id.desc())
        
        return query.paginate(page=page, per_page=per_page, error_out=False)
