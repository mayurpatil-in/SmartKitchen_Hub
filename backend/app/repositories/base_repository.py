from app.extensions import db

class BaseRepository:
    """Base repository pattern implementation offering default CRUD controls."""
    model = None

    def __init__(self):
        if self.model is None:
            raise NotImplementedError("Subclassed repositories must define 'model' attribute.")

    def get_by_id(self, entity_id):
        """Fetches a single entity by its primary key ID."""
        return db.session.get(self.model, entity_id)

    def get_all(self):
        """Fetches all rows for the repository model."""
        return self.model.query.all()

    def create(self, entity):
        """Persists and commits a new record to the database."""
        db.session.add(entity)
        db.session.commit()
        return entity

    def update(self, entity):
        """Commits changes made to an existing record."""
        db.session.commit()
        return entity

    def delete(self, entity):
        """Deletes a record and commits the transaction."""
        db.session.delete(entity)
        db.session.commit()
        return True
