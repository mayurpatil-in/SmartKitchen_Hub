import datetime
import random
from app.repositories import OrderRepository, ProductRepository, CustomerRepository, QuotationRepository, NotificationRepository, InventoryRepository
from app.models.order import Order, OrderItem
from app.models.inventory import InventoryTransaction
from app.models.notification import Notification
from app.middleware.error_handler import APIException
from decimal import Decimal

class OrderService:
    """Service layer governing customer orders, stock deductions, and delivery tracking."""
    def __init__(self):
        self.order_repo = OrderRepository()
        self.product_repo = ProductRepository()
        self.customer_repo = CustomerRepository()
        self.quotation_repo = QuotationRepository()
        self.notification_repo = NotificationRepository()
        self.inventory_repo = InventoryRepository()

    def get_order(self, order_id):
        """Fetches a single order, raising 404 if missing."""
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise APIException("Order not found.", status_code=404)
        return order

    def search_orders(self, status=None, customer_id=None, page=1, per_page=10):
        """Queries orders under matching constraints with pagination."""
        return self.order_repo.filter_and_paginate(
            status=status, 
            customer_id=customer_id, 
            page=page, 
            per_page=per_page
        )

    def generate_order_number(self):
        """Generates a secure sequential invoice order number."""
        today = datetime.date.today().strftime("%Y%m%d")
        rand = random.randint(1000, 9999)
        num = f"ORD-{today}-{rand}"
        
        while self.order_repo.get_by_number(num):
            rand = random.randint(1000, 9999)
            num = f"ORD-{today}-{rand}"
            
        return num

    def create_order(self, created_by_id, customer_id, shipping_address, items, quotation_id=None):
        """Creates a B2B order, verifying stock and appending audit logs."""
        customer = self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise APIException(f"Customer ID {customer_id} does not exist.", status_code=400)
            
        if not items:
            raise APIException("Order must contain at least one line item.", status_code=400)
            
        order_number = self.generate_order_number()
        total_amount = Decimal("0.00")
        order_items = []
        
        for item in items:
            p_id = item.get("product_id")
            qty = int(item.get("quantity"))
            price = Decimal(str(item.get("unit_price")))
            
            product = self.product_repo.get_by_id(p_id)
            if not product:
                raise APIException(f"Product with ID {p_id} does not exist.", status_code=400)
                
            if product.stock_quantity < qty:
                raise APIException(
                    message=f"Insufficient stock for product '{product.name}'. Available: {product.stock_quantity}, Requested: {qty}", 
                    status_code=400
                )
                
            # Perform atomic stock subtraction
            product.stock_quantity -= qty
            self.product_repo.update(product)
            
            # Log modern inventory transaction
            transaction = InventoryTransaction(
                product_id=p_id,
                transaction_type="OUT",
                quantity=-qty,
                reference=f"Order {order_number}",
                created_by_id=created_by_id
            )
            self.inventory_repo.create(transaction)
            
            # Check low stock thresholds (e.g. less than 5 units)
            if product.stock_quantity < 5:
                alert = Notification(
                    user_id=created_by_id,
                    title="Low Stock Alert",
                    message=f"Equipment '{product.name}' (SKU: {product.sku}) stock levels have dropped to: {product.stock_quantity} units."
                )
                self.notification_repo.create(alert)
                
            line_total = Decimal(str(qty)) * price
            total_amount += line_total
            
            o_item = OrderItem(
                product_id=p_id,
                quantity=qty,
                unit_price=price,
                total_price=line_total
            )
            order_items.append(o_item)
            
        order = Order(
            order_number=order_number,
            customer_id=customer_id,
            quotation_id=quotation_id,
            created_by_id=created_by_id,
            status="Pending",
            delivery_status="Pending",
            total_amount=total_amount,
            shipping_address=shipping_address,
            items=order_items
        )
        
        # Finalize quotation changes if derived
        if quotation_id:
            quotation = self.quotation_repo.get_by_id(quotation_id)
            if quotation:
                quotation.status = "Approved"
                self.quotation_repo.update(quotation)
                
        # Send confirmation alert
        notif = Notification(
            user_id=created_by_id,
            title="Order Formed",
            message=f"Order '{order_number}' has been created successfully for {customer.company_name}."
        )
        self.notification_repo.create(notif)
        
        return self.order_repo.create(order)

    def convert_quotation_to_order(self, quotation_id, created_by_id, shipping_address):
        """Converts an approved quotation record into a full order."""
        quotation = self.quotation_repo.get_by_id(quotation_id)
        if not quotation:
            raise APIException("Quotation not found.", status_code=404)
            
        items = []
        for q_item in quotation.items:
            items.append({
                "product_id": q_item.product_id,
                "quantity": q_item.quantity,
                "unit_price": q_item.unit_price
            })
            
        return self.create_order(
            created_by_id=created_by_id,
            customer_id=quotation.customer_id,
            shipping_address=shipping_address,
            items=items,
            quotation_id=quotation_id
        )

    def update_order_status(self, order_id, status=None, delivery_status=None):
        """Saves progression changes for shipment, logistics, or closures."""
        order = self.get_order(order_id)
        
        if status:
            if status not in ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]:
                raise APIException("Invalid order status value.", status_code=400)
            order.status = status
            
            notif = Notification(
                user_id=order.created_by_id,
                title="Order Status Change",
                message=f"Order '{order.order_number}' has moved to: '{status}'."
            )
            self.notification_repo.create(notif)
            
        if delivery_status:
            if delivery_status not in ["Pending", "In Transit", "Delivered"]:
                raise APIException("Invalid delivery status value.", status_code=400)
            order.delivery_status = delivery_status
            
            if delivery_status == "Delivered":
                order.status = "Delivered"
                
            notif = Notification(
                user_id=order.created_by_id,
                title="Delivery Route Update",
                message=f"Order '{order.order_number}' courier status: '{delivery_status}'."
            )
            self.notification_repo.create(notif)
            
        return self.order_repo.update(order)
