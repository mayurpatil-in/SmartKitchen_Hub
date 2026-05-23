from flask import Blueprint
from app.controllers.service_controller import ServiceController

services_bp = Blueprint("services", __name__)
service_controller = ServiceController()

@services_bp.route("", methods=["GET"])
def get_requests():
    """Queries servicing tickets matching technician or customer roles."""
    return service_controller.get_requests()

@services_bp.route("", methods=["POST"])
def create_request():
    """Submits a warranty repair or servicing call."""
    return service_controller.create()

@services_bp.route("/<int:service_id>/assign", methods=["POST"])
def assign(service_id):
    """Assigns technician users to open tickets."""
    return service_controller.assign(service_id)

@services_bp.route("/<int:service_id>/resolution", methods=["PUT"])
def update_resolution(service_id):
    """Closes tickets with technical summary reports."""
    return service_controller.update_resolution(service_id)
