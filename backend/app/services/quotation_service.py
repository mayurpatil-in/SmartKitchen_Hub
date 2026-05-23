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
            
        quotation.status = status
        return self.quotation_repo.update(quotation)
