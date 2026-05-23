from flask import Blueprint
from app.controllers.notification_controller import NotificationController

notifications_bp = Blueprint("notifications", __name__)
notification_controller = NotificationController()

@notifications_bp.route("", methods=["GET"])
def get_notifications():
    """Queries logged alerts for the user."""
    return notification_controller.get_notifications()

@notifications_bp.route("/<int:notification_id>/read", methods=["PUT"])
def mark_read(notification_id):
    """Toggles verified alert read states."""
    return notification_controller.mark_read(notification_id)

@notifications_bp.route("/read-all", methods=["PUT"])
def mark_all_read():
    """Bulk sets all unread alert states to read."""
    return notification_controller.mark_all_read()
