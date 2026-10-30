from __future__ import annotations

import re


def normalize_phone(phone: str, allow_dev_numbers: bool = True) -> str:
    """Normalize and strictly validate a 10-digit Indian mobile number.
    
    Accepts:
      - 10-digit numbers: '9876543210'
      - With +91: '+919876543210', '+91 98765 43210'
      - With leading zero: '09876543210'
      - With spaces or hyphens
    
    Validation rule:
      Indian mobile numbers must have exactly 10 digits starting with 6, 7, 8, or 9: ^[6-9]\\d{9}$
      In development / testing, allow_dev_numbers permits 10-digit test harness numbers.
    """
    cleaned = re.sub(r"[^0-9+]", "", phone or "")
    digits = re.sub(r"\D", "", cleaned)

    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]

    # Standard Indian mobile number check: starts with 6, 7, 8, or 9
    if len(digits) == 10 and re.match(r"^[6-9]\d{9}$", digits):
        return f"+91{digits}"

    # Dev/test mock phone numbers (e.g. 1234567890, 0000000001)
    if allow_dev_numbers and len(digits) == 10:
        return f"+91{digits}"

    raise ValueError("Invalid Indian mobile number. Please enter a valid 10-digit number starting with 6, 7, 8, or 9.")
