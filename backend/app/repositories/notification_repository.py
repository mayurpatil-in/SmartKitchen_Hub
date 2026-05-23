from app.repositories.base_repository import BaseRepository
from app.models.notification import Notification

class NotificationRepository(BaseRepository):
    """Repository handling notification records."""
    model = Notification

    def get_by_user_id(self, user_id, is_read=None, limit=20):
        """Fetches recent notification entries for a user."""
        query = self.model.query.filter_by(user_id=user_id)
        
        if is_read is not None:
            query = query.filter_by(is_read=is_read)
            
        return query.order_by(self.model.created_at.desc()).limit(limit).all()

    def mark_all_as_read(self, user_id):
        """Toggles all unread items to read state in a single transaction."""
        from app.extensions import db
        self.model.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
        db.session.commit()
        return True
