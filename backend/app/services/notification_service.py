from app.repositories import NotificationRepository
from app.middleware.error_handler import APIException

class NotificationService:
    """Service layer governing system alerts and read toggling."""
    def __init__(self):
        self.notification_repo = NotificationRepository()

    def get_notifications(self, user_id, is_read=None, limit=20):
        """Fetches recent notification entries for a user."""
        return self.notification_repo.get_by_user_id(user_id, is_read=is_read, limit=limit)

    def mark_as_read(self, notification_id, user_id):
        """Marks a single notification as read, checking owner permissions."""
        notif = self.notification_repo.get_by_id(notification_id)
        if not notif:
            raise APIException("Notification not found.", status_code=404)
            
        if notif.user_id != user_id:
            raise APIException("Access denied.", status_code=403)
            
        notif.is_read = True
        return self.notification_repo.update(notif)

    def mark_all_read(self, user_id):
        """Bulk updates all unread notifications for a user to read."""
        return self.notification_repo.mark_all_as_read(user_id)
