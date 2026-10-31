"""Interactive IPython shell for EcoSync backend (like Django's python manage.py shell).

Usage:
    cd backend
    python shell.py
"""

from pathlib import Path
import sys

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import IPython
from sqlalchemy import select

from app.db import SessionLocal, engine
import app.models as models
from app.models import *  # noqa: F401, F403

db = SessionLocal()

banner = """
======================================================================
 EcoSync Interactive Shell (IPython)
======================================================================
 Pre-loaded Objects:
   engine        : SQLAlchemy Engine instance
   SessionLocal  : SQLAlchemy Session maker
   db            : Active Database Session
   models        : Module containing all platform models
   select        : SQLAlchemy select function

 All SQLAlchemy models (User, Zone, Vehicle, PickupRequest, etc.) are imported.
 Type 'exit' or press Ctrl+D to quit.
======================================================================
"""

user_ns = {
    "engine": engine,
    "SessionLocal": SessionLocal,
    "db": db,
    "models": models,
    "select": select,
    **{k: v for k, v in models.__dict__.items() if not k.startswith("_")},
}

try:
    print(banner)
    IPython.start_ipython(argv=[], user_ns=user_ns)
finally:
    db.close()
