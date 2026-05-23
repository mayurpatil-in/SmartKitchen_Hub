import os
import click
from flask import Flask
from app.config.config import config_by_name
from app.extensions import db, migrate, jwt, cors
from app.api import register_blueprints
from app.middleware.error_handler import register_error_handlers
from app.utils.logger import logger

def create_app(config_name=None):
    """Flask App Factory pattern to initialize application contexts."""
    app = Flask(__name__)
    
    # Load configuration
    if not config_name:
        config_name = os.getenv("FLASK_ENV", "development")
        
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))
    
    logger.info(f"Starting SmartKitchen Hub Flask App (Env: {config_name})")
    
    # Initialize extensions
    cors.init_app(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Register core error handlers
    register_error_handlers(app)
    
    # Register blueprints/routes
    register_blueprints(app)
    
    # Set up global seed command
    @app.cli.command("seed")
    def seed():
        """Seeds the database with baseline B2B records."""
        from app.utils.seeder import seed_db
        try:
            seed_db()
            click.echo("Database seeded successfully.")
        except Exception as e:
            click.echo(f"Database seeding failed: {str(e)}")
            logger.error("Seeding operation failed", exc_info=True)
            
    # Setup context-level DB creation (for fast SQLite developer trials)
    @app.cli.command("create-db")
    def create_db():
        """Creates database tables."""
        db.create_all()
        click.echo("Created all tables successfully.")
        
    return app
