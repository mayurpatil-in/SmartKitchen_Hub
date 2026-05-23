from flask import request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import QuotationService
from app.schemas import QuotationSchema
from app.middleware.auth_middleware import role_required
from app.utils.pdf_generator import generate_quotation_pdf
import datetime

class QuotationController:
    """Controller handling price quotations and programmatic PDFs."""
    def __init__(self):
        self.quotation_service = QuotationService()
        self.quotation_schema = QuotationSchema()
        self.quotations_schema = QuotationSchema(many=True)

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def get_quotations(self):
        """Fetches a list of historical B2B quotes."""
        status = request.args.get("status")
        customer_id = request.args.get("customer_id", type=int)
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        
        pagination = self.quotation_service.search_quotations(
            status=status, 
            customer_id=customer_id, 
            page=page, 
            per_page=per_page
        )
        
        return jsonify({
            "success": True,
            "data": {
                "items": self.quotations_schema.dump(pagination.items),
                "total": pagination.total,
                "pages": pagination.pages,
                "page": pagination.page,
                "per_page": pagination.per_page
            }
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager", "Customer")
    def get_quotation(self, quotation_id):
        """Fetches a single quote profile, asserting customer permissions."""
        quotation = self.quotation_service.get_quotation(quotation_id)
        claims = get_jwt()
        
        if claims.get("role") == "Customer":
            user_id = int(get_jwt_identity())
            if not quotation.customer or quotation.customer.user_id != user_id:
                return jsonify({"success": False, "message": "Access denied."}), 403
                
        return jsonify({
            "success": True,
            "data": self.quotation_schema.dump(quotation)
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def create(self):
        """Compiles pricing calculations and generates a new invoice quote."""
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        errors = self.quotation_schema.validate(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 422
            
        valid_until_str = data.get("valid_until")
        # Parse date type safely
        try:
            if isinstance(valid_until_str, str):
                valid_until = datetime.datetime.strptime(valid_until_str.split("T")[0], "%Y-%m-%d").date()
            else:
                valid_until = valid_until_str
        except Exception:
            return jsonify({"success": False, "message": "Invalid date format. Expected YYYY-MM-DD"}), 422
            
        quotation = self.quotation_service.create_quotation(
            created_by_id=user_id,
            customer_id=data.get("customer_id"),
            valid_until=valid_until,
            tax=data.get("tax", 0),
            discount=data.get("discount", 0),
            items=data.get("items"),
            notes=data.get("notes")
        )
        
        return jsonify({
            "success": True,
            "message": "Quotation generated successfully.",
            "data": self.quotation_schema.dump(quotation)
        }), 201

    @jwt_required()
    @role_required("Admin", "Sales Manager")
    def update_status(self, quotation_id):
        """Updates the status (Sent -> Approved/Rejected)."""
        data = request.get_json() or {}
        status = data.get("status")
        
        quotation = self.quotation_service.update_status(quotation_id, status)
        return jsonify({
            "success": True,
            "message": "Quotation status updated.",
            "data": self.quotation_schema.dump(quotation)
        }), 200

    @jwt_required()
    @role_required("Admin", "Sales Manager", "Customer")
    def download_pdf(self, quotation_id):
        """Funnels the quote data into reportlab and streams the generated binary PDF to download."""
        quotation = self.quotation_service.get_quotation(quotation_id)
        claims = get_jwt()
        
        if claims.get("role") == "Customer":
            user_id = int(get_jwt_identity())
            if not quotation.customer or quotation.customer.user_id != user_id:
                return jsonify({"success": False, "message": "Access denied."}), 403
                
        pdf_buffer = generate_quotation_pdf(quotation)
        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"Quotation_{quotation.quotation_number}.pdf"
        )
