import logging
import sys
import os

def setup_logger(name="smartkitchen"):
    """Configures structured console logging for the application."""
    logger = logging.getLogger(name)
    
    # Avoid adding duplicate handlers if already configured
    if not logger.handlers:
        log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
        log_level = getattr(logging, log_level_str, logging.INFO)
        logger.setLevel(log_level)
        
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s in %(module)s [%(pathname)s:%(lineno)d]: %(message)s'
        )
        
        # Standard stdout console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        console_handler.setLevel(log_level)
        logger.addHandler(console_handler)
        
    return logger

# Shared logger instance
logger = setup_logger()
