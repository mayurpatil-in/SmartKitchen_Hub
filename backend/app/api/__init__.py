from app.api.auth import auth_bp
from app.api.products import products_bp
from app.api.customers import customers_bp
from app.api.quotations import quotations_bp
from app.api.orders import orders_bp
from app.api.inventory import inventory_bp
from app.api.services import services_bp
from app.api.analytics import analytics_bp
from app.api.notifications import notifications_bp

def register_blueprints(app):
    """Registers all custom resource Blueprints onto the main Flask App factory."""
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(customers_bp, url_prefix="/api/customers")
    app.register_blueprint(quotations_bp, url_prefix="/api/quotations")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(services_bp, url_prefix="/api/services")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
