from flask import Blueprint
from app.controllers.analytics_controller import AnalyticsController

analytics_bp = Blueprint("analytics", __name__)
analytics_controller = AnalyticsController()

@analytics_bp.route("/dashboard", methods=["GET"])
def get_dashboard_summary():
    """Aggregates sales metrics, charts data, and activity feeds."""
    return analytics_controller.get_dashboard_summary()
