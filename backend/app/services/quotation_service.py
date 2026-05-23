import datetime
import random
from app.repositories import QuotationRepository, ProductRepository, CustomerRepository
from app.models.quotation import Quotation, QuotationItem
from app.middleware.error_handler import APIException
from decimal import Decimal

class QuotationService:
    """Service layer governing quotation calculations and proposal statuses."""
    def __init__(self):
        self.quotation_repo = QuotationRepository()
        self.product_repo = ProductRepository()
        self.customer_repo = CustomerRepository()

    def get_quotation(self, quotation_id):
        """Fetches a single quotation, raising 404 if missing."""
        quotation = self.quotation_repo.get_by_id(quotation_id)
        if not quotation:
            raise APIException("Quotation not found.", status_code=404)
        return quotation

    def search_quotations(self, status=None, customer_id=None, page=1, per_page=10):
        """Queries paginated quotations based on status or customer parameters."""
        return self.quotation_repo.filter_and_paginate(
            status=status, 
            customer_id=customer_id, 
            page=page, 
            per_page=per_page
        )

    def generate_quotation_number(self):
        """Generates a secure, guaranteed-unique sequential invoice code."""
        today = datetime.date.today().strftime("%Y%m%d")
        rand = random.randint(1000, 9999)
        num = f"QTN-{today}-{rand}"
        
        while self.quotation_repo.get_by_number(num):
            rand = random.randint(1000, 9999)
            num = f"QTN-{today}-{rand}"
            
        return num

    def create_quotation(self, created_by_id, customer_id, valid_until, tax, discount, items, notes=None):
        """Builds a new Quotation with verified B2B customers, products, and prices."""
        customer = self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise APIException(f"Customer with ID {customer_id} does not exist.", status_code=400)
            
        if not items:
            raise APIException("Quotation must contain at least one line item.", status_code=400)
            
        # Parse inputs to Decimals to guarantee currency precision
        tax_dec = Decimal(str(tax))
        discount_dec = Decimal(str(discount))
        
        subtotal = Decimal("0.00")
        quotation_items = []
        
        for item in items:
            p_id = item.get("product_id")
            qty = int(item.get("quantity"))
            price = Decimal(str(item.get("unit_price")))
            
            product = self.product_repo.get_by_id(p_id)
            if not product:
                raise APIException(f"Product with ID {p_id} does not exist.", status_code=400)
                
            line_total = Decimal(str(qty)) * price
            subtotal += line_total
            
            q_item = QuotationItem(
                product_id=p_id,
                quantity=qty,
                unit_price=price,
                total_price=line_total
            )
            quotation_items.append(q_item)
            
        total = subtotal + tax_dec - discount_dec
        quotation_number = self.generate_quotation_number()
        
        quotation = Quotation(
            quotation_number=quotation_number,
            customer_id=customer_id,
            created_by_id=created_by_id,
            status="Draft",
            valid_until=valid_until,
            subtotal=subtotal,
            tax=tax_dec,
            discount=discount_dec,
            total=total,
            notes=notes,
            items=quotation_items
        )
        
        return self.quotation_repo.create(quotation)

    def update_status(self, quotation_id, status):
        """Updates the quotation workflow state (Draft -> Sent -> Approved/Rejected)."""
        quotation = self.get_quotation(quotation_id)
        
        if status not in ["Draft", "Sent", "Approved", "Rejected"]:
            raise APIException("Invalid quotation status.", status_code=400)
            
        # If resetting from Approved back to Draft or Sent, we must handle the associated Order if it exists
        if status in ["Draft", "Sent"] and quotation.status == "Approved":
            associated_order = quotation.order
            if associated_order:
                from app.models.inventory import InventoryTransaction
                from app.extensions import db
                
                # 1. Restore product stock level and log modern IN inventory transaction
                for item in associated_order.items:
                    product = self.product_repo.get_by_id(item.product_id)
                    if product:
                        product.stock_quantity += item.quantity
                        self.product_repo.update(product)
                        
                        transaction = InventoryTransaction(
                            product_id=item.product_id,
                            transaction_type="IN",
                            quantity=item.quantity,
                            reference=f"Quote Reset (ORD: {associated_order.order_number})",
                            created_by_id=associated_order.created_by_id
                        )
                        db.session.add(transaction)
                
                # 2. Perform database order deletion
                db.session.delete(associated_order)
                db.session.commit()
            
        quotation.status = status
        return self.quotation_repo.update(quotation)

    def delete_quotation(self, quotation_id):
        """Deletes a quotation, making sure its status is 'Draft'."""
        quotation = self.get_quotation(quotation_id)
        if quotation.status != "Draft":
            raise APIException("Only Draft quotations can be deleted.", status_code=400)
        return self.quotation_repo.delete(quotation)

    def update_quotation(self, quotation_id, customer_id, valid_until, tax, discount, items, notes=None):
        """Updates an existing Draft quotation, including its items and totals."""
        quotation = self.get_quotation(quotation_id)
        if quotation.status != "Draft":
            raise APIException("Only Draft quotations can be edited.", status_code=400)
            
        customer = self.customer_repo.get_by_id(customer_id)
        if not customer:
            raise APIException(f"Customer with ID {customer_id} does not exist.", status_code=400)
            
        if not items:
            raise APIException("Quotation must contain at least one line item.", status_code=400)
            
        tax_dec = Decimal(str(tax))
        discount_dec = Decimal(str(discount))
        
        # Clear existing items
        for existing_item in list(quotation.items):
            self.quotation_repo.delete_item(existing_item)
            
        subtotal = Decimal("0.00")
        quotation_items = []
        
        for item in items:
            p_id = item.get("product_id")
            qty = int(item.get("quantity"))
            price = Decimal(str(item.get("unit_price")))
            
            product = self.product_repo.get_by_id(p_id)
            if not product:
                raise APIException(f"Product with ID {p_id} does not exist.", status_code=400)
                
            line_total = Decimal(str(qty)) * price
            subtotal += line_total
            
            q_item = QuotationItem(
                product_id=p_id,
                quantity=qty,
                unit_price=price,
                total_price=line_total
            )
            quotation_items.append(q_item)
            
        total = subtotal + tax_dec - discount_dec
        
        # Update quotation attributes
        quotation.customer_id = customer_id
        quotation.valid_until = valid_until
        quotation.subtotal = subtotal
        quotation.tax = tax_dec
        quotation.discount = discount_dec
        quotation.total = total
        quotation.notes = notes
        quotation.items = quotation_items
        
        return self.quotation_repo.update(quotation)
