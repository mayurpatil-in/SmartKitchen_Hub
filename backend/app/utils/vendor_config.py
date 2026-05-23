import os
import json

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'vendor_config.json')

DEFAULT_SETTINGS = {
    "company_name": "SmartKitchen Hub Solutions Ltd.",
    "company_tagline": "Enterprise Commercial Kitchen Solutions",
    "address": "100 Industrial Parkway, Suite A\nMumbai, MH 400051",
    "gstin": "27AAACS1234A1Z1",
    "pan": "AAACS1234A",
    "email": "billing@smartkitchen.com",
    "bank_account_name": "SmartKitchen Hub Solutions Pvt. Ltd.",
    "bank_name": "HDFC Bank Limited",
    "bank_account_no": "50200012345678 (Current Account)",
    "bank_ifsc": "HDFC0000060",
    "bank_branch": "Bandra Kurla Complex, Mumbai"
}

def load_vendor_settings():
    """Loads vendor settings from vendor_config.json. Self-heals using defaults if file not present."""
    if not os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'w') as f:
                json.dump(DEFAULT_SETTINGS, f, indent=4)
        except Exception:
            return DEFAULT_SETTINGS
    
    try:
        with open(CONFIG_PATH, 'r') as f:
            data = json.load(f)
            # Ensure all standard keys exist, merge with defaults if missing
            updated = False
            for k, v in DEFAULT_SETTINGS.items():
                if k not in data:
                    data[k] = v
                    updated = True
            if updated:
                with open(CONFIG_PATH, 'w') as wf:
                    json.dump(data, wf, indent=4)
            return data
    except Exception:
        return DEFAULT_SETTINGS

def save_vendor_settings(data):
    """Validates and saves the vendor settings, returning the saved data."""
    saved_data = {}
    for k in DEFAULT_SETTINGS.keys():
        saved_data[k] = str(data.get(k, DEFAULT_SETTINGS[k])).strip()
    
    with open(CONFIG_PATH, 'w') as f:
        json.dump(saved_data, f, indent=4)
    return saved_data
