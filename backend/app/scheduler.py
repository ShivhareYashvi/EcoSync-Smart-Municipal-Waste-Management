"""APScheduler background scheduler for EcoSync.

Jobs
----
Phase 1:
- ``send_evening_reminders``     : Daily at 18:00 UTC — SMS for next-day pickups.
- ``send_hour_before_reminders`` : Every 15 minutes — SMS for pickups within 1 hour.

Phase 2:
- ``run_hotspot_detection``      : Daily at 02:00 UTC — flag/resolve complaint hotspots.
- ``alert_maintenance_due``      : Daily at 07:00 UTC — notify about vehicles due for service.

The scheduler is started and stopped by the FastAPI ``lifespan`` context
manager in ``app/main.py``.
"""

from apscheduler.schedulers.background import BackgroundScheduler

from app.services.reminder_service import send_evening_reminders, send_hour_before_reminders

scheduler = BackgroundScheduler(timezone="UTC")

# Evening reminder: daily at 18:00 UTC
scheduler.add_job(
    send_evening_reminders,
    trigger="cron",
    hour=18,
    minute=0,
    id="evening_reminders",
    replace_existing=True,
)

# 1-hour-before reminder: every 15 minutes (catches pickups in the rolling window)
scheduler.add_job(
    send_hour_before_reminders,
    trigger="interval",
    minutes=15,
    id="hour_before_reminders",
    replace_existing=True,
)


# ── Phase 2 jobs ──────────────────────────────────────────────────────────────

def _run_hotspot_detection() -> None:
    """Group complaints by zone over 30-day window; flag/resolve hotspots."""
    from app.db import SessionLocal
    from app.services.hotspot_service import hotspot_service
    with SessionLocal() as session:
        result = hotspot_service.run_hotspot_detection(session)
        print(f"[Hotspot] flagged={result['flagged']} resolved={result['resolved']}")


def _alert_maintenance_due() -> None:
    """Log vehicles due for maintenance within 7 days (extend with SMS/push as needed)."""
    from app.db import SessionLocal
    from app.services.fleet_service import fleet_service
    with SessionLocal() as session:
        vehicles = fleet_service.get_vehicles_due_for_maintenance(session)
        for v in vehicles:
            print(f"[Fleet] Maintenance due: {v.registration_number} on {v.maintenance_due_date}")


# Hotspot detection: daily at 02:00 UTC
scheduler.add_job(
    _run_hotspot_detection,
    trigger="cron",
    hour=2,
    minute=0,
    id="hotspot_detection",
    replace_existing=True,
)

# Maintenance alert: daily at 07:00 UTC
scheduler.add_job(
    _alert_maintenance_due,
    trigger="cron",
    hour=7,
    minute=0,
    id="maintenance_alert",
    replace_existing=True,
)

