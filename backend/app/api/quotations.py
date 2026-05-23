from flask import Blueprint
from app.controllers.quotation_controller import QuotationController

quotations_bp = Blueprint("quotations", __name__)
quotation_controller = QuotationController()

@quotations_bp.route("", methods=["GET"])
def get_quotations():
    """Queries quotation records list."""
    return quotation_controller.get_quotations()

@quotations_bp.route("/<int:quotation_id>", methods=["GET"])
def get_quotation(quotation_id):
    """Queries details of a quote, checking ownership."""
    return quotation_controller.get_quotation(quotation_id)

@quotations_bp.route("", methods=["POST"])
def create_quotation():
    """Calculates price matrix and drafts a new quote."""
    return quotation_controller.create()

@quotations_bp.route("/<int:quotation_id>/status", methods=["PUT"])
def update_status(quotation_id):
    """Updates quote progression state (Approved/Rejected)."""
    return quotation_controller.update_status(quotation_id)

@quotations_bp.route("/<int:quotation_id>/pdf", methods=["GET"])
def download_pdf(quotation_id):
    """Funnels details to ReportLab and sends a customized PDF download."""
    return quotation_controller.download_pdf(quotation_id)

@quotations_bp.route("/<int:quotation_id>", methods=["PUT"])
def update_quotation_details(quotation_id):
    """Updates Draft quotation details and items."""
    return quotation_controller.update(quotation_id)

@quotations_bp.route("/<int:quotation_id>", methods=["DELETE"])
def delete_quotation(quotation_id):
    """Deletes a Draft quotation."""
    return quotation_controller.delete(quotation_id)

@quotations_bp.route("/vendor-settings", methods=["GET"])
def get_vendor_settings():
    """Fetches dynamic vendor configuration settings."""
    return quotation_controller.get_vendor_settings()

@quotations_bp.route("/vendor-settings", methods=["POST"])
def update_vendor_settings():
    """Updates dynamic vendor configuration settings."""
    return quotation_controller.update_vendor_settings()

