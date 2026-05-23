from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services import NotificationService
from app.schemas import NotificationSchema

class NotificationController:
    """Controller handling user notifications and read flags."""
    def __init__(self):
        self.notification_service = NotificationService()
        self.notif_schema = NotificationSchema()
        self.notifs_schema = NotificationSchema(many=True)

    @jwt_required()
    def get_notifications(self):
        """Fetches recent notification entries for the logged-in user."""
        user_id = int(get_jwt_identity())
        notifs = self.notification_service.get_notifications(user_id=user_id)
        return jsonify({
            "success": True,
            "data": self.notifs_schema.dump(notifs)
        }), 200

    @jwt_required()
    def mark_read(self, notification_id):
        """Toggles an alert read state."""
        user_id = int(get_jwt_identity())
        notif = self.notification_service.mark_as_read(notification_id=notification_id, user_id=user_id)
        return jsonify({
            "success": True,
            "message": "Notification marked as read.",
            "data": self.notif_schema.dump(notif)
        }), 200

    @jwt_required()
    def mark_all_read(self):
        """Bulk updates all unread alerts to read state."""
        user_id = int(get_jwt_identity())
        self.notification_service.mark_all_read(user_id=user_id)
        return jsonify({
            "success": True,
            "message": "All notifications marked as read."
        }), 200
