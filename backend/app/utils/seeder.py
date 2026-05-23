import datetime
from app.extensions import db
from app.models import Role, User, Category, Product, Customer, Quotation, QuotationItem, Order, OrderItem, InventoryTransaction, ServiceRequest, Notification
from decimal import Decimal

def seed_db():
    """Seeds the database with baseline B2B records for instant visualization."""
    print("Initializing Database Seeding...")
    
    # 1. Seed Roles
    roles = [
        {"name": "Admin", "description": "System administrator with unrestricted access."},
        {"name": "Sales Manager", "description": "Manages customers, quotations, products, and sales logs."},
        {"name": "Technician", "description": "Manages equipment repairs, scheduled servicing, and warranty calls."},
        {"name": "Customer", "description": "B2B customer contact viewing products, quotations, and repair requests."}
    ]
    
    seeded_roles = {}
    for r_data in roles:
        role = Role.query.filter_by(name=r_data["name"]).first()
        if not role:
            role = Role(name=r_data["name"], description=r_data["description"])
            db.session.add(role)
            db.session.commit()
            print(f"Created role: {role.name}")
        seeded_roles[r_data["name"]] = role

    # 2. Seed Default Users
    users = [
        {"email": "admin@smartkitchen.com", "first_name": "Marcus", "last_name": "Vance", "role": "Admin", "pw": "Admin@123"},
        {"email": "sales@smartkitchen.com", "first_name": "Sarah", "last_name": "Jenkins", "role": "Sales Manager", "pw": "Sales@123"},
        {"email": "tech@smartkitchen.com", "first_name": "Robert", "last_name": "Miller", "role": "Technician", "pw": "Tech@123"},
        {"email": "customer@smartkitchen.com", "first_name": "John", "last_name": "Doe", "role": "Customer", "pw": "Customer@123"}
    ]
    
    seeded_users = {}
    for u_data in users:
        user = User.query.filter_by(email=u_data["email"]).first()
        if not user:
            role = seeded_roles[u_data["role"]]
            user = User(
                email=u_data["email"],
                first_name=u_data["first_name"],
                last_name=u_data["last_name"],
                role_id=role.id
            )
            user.set_password(u_data["pw"])
            db.session.add(user)
            db.session.commit()
            print(f"Created user: {user.email}")
        seeded_users[u_data["role"]] = user

    # 3. Seed Product Categories
    categories = [
        {"name": "Refrigeration", "description": "Commercial walk-in freezers, prep tables, and coolers."},
        {"name": "Cooking Equipment", "description": "Industrial fryers, gas ranges, convection ovens, and grills."},
        {"name": "Food Prep", "description": "Heavy duty commercial mixers, slicers, processors, and blenders."},
        {"name": "Dishwashing", "description": "High-temp conveyor dishwashers, undercounter washers, and sinks."}
    ]
    
    seeded_categories = {}
    for c_data in categories:
        cat = Category.query.filter_by(name=c_data["name"]).first()
        if not cat:
            cat = Category(name=c_data["name"], description=c_data["description"])
            db.session.add(cat)
            db.session.commit()
            print(f"Created category: {cat.name}")
        seeded_categories[c_data["name"]] = cat

    # 4. Seed Products
    products = [
        {
            "sku": "REF-O50-COL",
            "name": "SuperCool Double Door Upright Refrigerator",
            "description": "Premium double door commercial reach-in refrigerator. Capacity 1000L. Digital temp controllers, stainless steel build.",
            "price": Decimal("2450.00"),
            "stock": 8,
            "cat": "Refrigeration",
            "specs": {"Capacity": "1000 Liters", "Dimensions": "1200x800x2000mm", "Power": "650W", "Weight": "180kg"},
            "images": ["/uploads/ref_upright.jpg"]
        },
        {
            "sku": "OVR-G60-CON",
            "name": "ChefMaster 6-Burner Gas Convection Range",
            "description": "Heavy-duty commercial 6 burner gas range with integrated convection oven base. Built for speed and high capacity.",
            "price": Decimal("3890.00"),
            "stock": 3,  # Trigger low stock alert behavior
            "cat": "Cooking Equipment",
            "specs": {"Burners": "6 Gas Burners", "BTU Output": "180,000 BTU/hr", "Dimensions": "900x850x1500mm", "Weight": "240kg"},
            "images": ["/uploads/oven_gas.jpg"]
        },
        {
            "sku": "MIX-P20-HEA",
            "name": "PowerMix 20-Quart Heavy Duty Planetary Mixer",
            "description": "High-durability planetary mixer with 3 speeds and safety guard. Includes bowl, wire whip, dough hook, and beater.",
            "price": Decimal("1299.00"),
            "stock": 12,
            "cat": "Food Prep",
            "specs": {"Bowl Capacity": "20 Quarts", "Motor Power": "1.5 HP", "Dimensions": "550x500x850mm", "Weight": "85kg"},
            "images": ["/uploads/mixer_planetary.jpg"]
        },
        {
            "sku": "DSH-H50-PAS",
            "name": "Dishwasher Hood-Type High Temp Pass-Through",
            "description": "High temperature pass-through hood dishwasher. Cleans up to 60 racks per hour. Fits standard racks, energy star certified.",
            "price": Decimal("5499.00"),
            "stock": 4,  # Under 5, triggers warnings!
            "cat": "Dishwashing",
            "specs": {"Capacity": "60 Racks/hr", "Water Temp": "82°C Sanitizing", "Dimensions": "750x750x1900mm", "Weight": "165kg"},
            "images": ["/uploads/dishwasher_hood.jpg"]
        }
    ]
    
    seeded_products = []
    for p_data in products:
        prod = Product.query.filter_by(sku=p_data["sku"]).first()
        if not prod:
            cat = seeded_categories[p_data["cat"]]
            prod = Product(
                sku=p_data["sku"],
                name=p_data["name"],
                description=p_data["description"],
                price=p_data["price"],
                stock_quantity=p_data["stock"],
                category_id=cat.id,
                specifications=p_data["specs"],
                images=p_data["images"]
            )
            db.session.add(prod)
            db.session.commit()
            print(f"Created product: {prod.sku}")
            
            # Log initial inventory addition
            admin = seeded_users["Admin"]
            tx = InventoryTransaction(
                product_id=prod.id,
                transaction_type="IN",
                quantity=p_data["stock"],
                reference="Initial Seed Inventory Addition",
                created_by_id=admin.id
            )
            db.session.add(tx)
            db.session.commit()
        seeded_products.append(prod)

    # 5. Seed Customers
    customers = [
        {
            "company_name": "Royal Bistro Foods Ltd.",
            "contact_person": "Arthur Dent",
            "phone": "+91 98765 43210",
            "address": "42 Restaurant Row, Ground Floor, Bandra West, Mumbai, MH 400050",
            "email_link": "customer@smartkitchen.com"
        },
        {
            "company_name": "Metro Hospitality Group",
            "contact_person": "Diana Prince",
            "phone": "+91 99988 77766",
            "address": "Nirlon Knowledge Park, Phase II, Goregaon East, Mumbai, MH 400063",
            "email_link": None
        }
    ]
    
    seeded_customers = []
    for c_data in customers:
        cust = Customer.query.filter_by(company_name=c_data["company_name"]).first()
        if not cust:
            user = None
            if c_data["email_link"]:
                user = User.query.filter_by(email=c_data["email_link"]).first()
            cust = Customer(
                company_name=c_data["company_name"],
                contact_person=c_data["contact_person"],
                phone=c_data["phone"],
                address=c_data["address"],
                user_id=user.id if user else None
            )
            db.session.add(cust)
            db.session.commit()
            print(f"Created B2B customer profile: {cust.company_name}")
        seeded_customers.append(cust)

    # 6. Seed Quotations
    sales_rep = seeded_users["Sales Manager"]
    cust_1 = seeded_customers[0]
    cust_2 = seeded_customers[1]
    prod_1 = seeded_products[0]
    prod_2 = seeded_products[1]
    
    quotations = [
        {
            "quotation_number": "QTN-20260520-1002",
            "customer": cust_1,
            "valid_days": 30,
            "status": "Approved",
            "items": [
                {"product": prod_1, "qty": 2, "price": Decimal("2450.00")},
                {"product": prod_2, "qty": 1, "price": Decimal("3890.00")}
            ],
            "tax": Decimal("300.00"),
            "discount": Decimal("150.00"),
            "notes": "Custom discount applied for bulk restaurant opening setup. Order scheduled immediately upon authorization."
        },
        {
            "quotation_number": "QTN-20260522-4521",
            "customer": cust_2,
            "valid_days": 15,
            "status": "Sent",
            "items": [
                {"product": prod_2, "qty": 1, "price": Decimal("3890.00")}
            ],
            "tax": Decimal("100.00"),
            "discount": Decimal("0.00"),
            "notes": "Price includes 1 year AMC support. Delivery within 7 working days."
        }
    ]
    
    for q_data in quotations:
        q = Quotation.query.filter_by(quotation_number=q_data["quotation_number"]).first()
        if not q:
            subtotal = sum(i["qty"] * i["price"] for i in q_data["items"])
            total = subtotal + q_data["tax"] - q_data["discount"]
            
            q_items = []
            for item in q_data["items"]:
                q_items.append(QuotationItem(
                    product_id=item["product"].id,
                    quantity=item["qty"],
                    unit_price=item["price"],
                    total_price=item["qty"] * item["price"]
                ))
                
            q = Quotation(
                quotation_number=q_data["quotation_number"],
                customer_id=q_data["customer"].id,
                created_by_id=sales_rep.id,
                status=q_data["status"],
                valid_until=datetime.date.today() + datetime.timedelta(days=q_data["valid_days"]),
                subtotal=subtotal,
                tax=q_data["tax"],
                discount=q_data["discount"],
                total=total,
                notes=q_data["notes"],
                items=q_items
            )
            db.session.add(q)
            db.session.commit()
            print(f"Created Quote seed: {q.quotation_number}")

    # 7. Seed Orders
    orders = [
        {
            "order_number": "ORD-20260520-2101",
            "customer": cust_1,
            "status": "Processing",
            "delivery": "Pending",
            "items": [
                {"product": prod_1, "qty": 1, "price": Decimal("2450.00")}
            ],
            "shipping": "Royal Bistro Central Kitchen, Gate 4, Western Express Highway, Mumbai",
            "quotation_link": None
        },
        {
            "order_number": "ORD-20260515-9921",
            "customer": cust_2,
            "status": "Delivered",
            "delivery": "Delivered",
            "items": [
                {"product": prod_1, "qty": 1, "price": Decimal("2450.00")},
                {"product": prod_2, "qty": 1, "price": Decimal("3890.00")}
            ],
            "shipping": "MHG Corporate Towers, Warehouse Block, Goregaon East, Mumbai",
            "quotation_link": None
        }
    ]
    
    for o_data in orders:
        o = Order.query.filter_by(order_number=o_data["order_number"]).first()
        if not o:
            total_amt = sum(i["qty"] * i["price"] for i in o_data["items"])
            o_items = []
            for item in o_data["items"]:
                o_items.append(OrderItem(
                    product_id=item["product"].id,
                    quantity=item["qty"],
                    unit_price=item["price"],
                    total_price=item["qty"] * item["price"]
                ))
            o = Order(
                order_number=o_data["order_number"],
                customer_id=o_data["customer"].id,
                created_by_id=sales_rep.id,
                status=o_data["status"],
                delivery_status=o_data["delivery"],
                total_amount=total_amt,
                shipping_address=o_data["shipping"],
                items=o_items
            )
            db.session.add(o)
            db.session.commit()
            print(f"Created Order seed: {o.order_number}")

    # 8. Seed Service Request / Warranty Tickets
    tech_rep = seeded_users["Technician"]
    services = [
        {
            "title": "Temperature fluctuating on Walk-In Coolers",
            "description": "Temperature readings show variances from +2°C up to +9°C in afternoon hours. Requires inspection of compressor gasket and thermostat relays.",
            "type": "Repair",
            "customer": cust_1,
            "product": prod_1,
            "status": "Assigned",
            "tech": tech_rep,
            "scheduled": datetime.datetime.now() + datetime.timedelta(days=1),
            "notes": None
        },
        {
            "title": "ChefMaster Gas Convection Range Installation",
            "description": "On-site commercial gas pipeline mapping, range levelling, gas line integration, and initial burners calibrating/ventilation testing.",
            "type": "Maintenance",
            "customer": cust_2,
            "product": prod_2,
            "status": "Completed",
            "tech": tech_rep,
            "scheduled": datetime.datetime.now() - datetime.timedelta(days=4),
            "notes": "Burners mapping completed successfully. Calibrated gas nozzles to custom pressure specs. Burners firing at maximum BTU output."
        }
    ]
    
    for s_data in services:
        sr = ServiceRequest.query.filter_by(title=s_data["title"]).first()
        if not sr:
            sr = ServiceRequest(
                customer_id=s_data["customer"].id,
                product_id=s_data["product"].id if s_data["product"] else None,
                service_type=s_data["type"],
                title=s_data["title"],
                description=s_data["description"],
                status=s_data["status"],
                technician_id=s_data["tech"].id if s_data["tech"] else None,
                scheduled_date=s_data["scheduled"],
                resolution_notes=s_data["notes"]
            )
            db.session.add(sr)
            db.session.commit()
            print(f"Created Service Ticket: {sr.title}")

    # 9. Seed System Notifications
    notifications = [
        {"title": "Low Stock Indicator", "message": "ChefMaster Gas Convection Range is running low on stock. Current level: 3 units."},
        {"title": "Service Assign Update", "message": "Temperature fluctuating ticket has been assigned to Technician Robert Miller."}
    ]
    
    admin_user = seeded_users["Admin"]
    for n_data in notifications:
        notif = Notification.query.filter_by(title=n_data["title"]).first()
        if not notif:
            notif = Notification(
                user_id=admin_user.id,
                title=n_data["title"],
                message=n_data["message"]
            )
            db.session.add(notif)
            db.session.commit()
            
    print("Database Seeding Successfully Completed!")
