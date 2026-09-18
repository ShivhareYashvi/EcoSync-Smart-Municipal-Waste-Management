"""Pickup reminder service — SMS notifications via the existing Twilio helper.

Two reminder windows:
- Evening before: fires daily at 18:00 local, sends SMS for next-day pickups.
- 1-hour before: fires every 15 min, sends SMS for pickups within the next hour.

Both functions are called by the APScheduler jobs in app/scheduler.py.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.pickup_request import PickupRequest
from app.models.user import User
from app.services.sms_service import send_twilio_sms


def _tomorrow() -> date:
    return (datetime.now(timezone.utc) + timedelta(days=1)).date()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def send_evening_reminders() -> None:
    """Query pickups scheduled for tomorrow and SMS each citizen."""
    tomorrow = _tomorrow()
    with SessionLocal() as session:
        rows = session.execute(
            select(PickupRequest, User).join(User, User.id == PickupRequest.user_id).where(
                PickupRequest.scheduled_date == tomorrow,
                PickupRequest.status.in_(["pending", "assigned", "in_progress"]),
            )
        ).all()

        for pickup, user in rows:
            if not user.phone:
                continue
            msg = (
                f"EcoSync Reminder: Your {pickup.waste_type} waste pickup is scheduled for "
                f"tomorrow ({tomorrow.strftime('%d %b')}) at {pickup.scheduled_time.strftime('%I:%M %p')}. "
                f"Please keep your waste ready and segregated."
            )
            try:
                send_twilio_sms(user.phone, msg)
            except Exception as exc:  # noqa: BLE001
                print(f"[reminder] Evening SMS failed for user {user.id}: {exc}")


def send_hour_before_reminders() -> None:
    """SMS citizens whose pickup window starts within the next 60 minutes."""
    now = _now_utc()
    # Build a 1-hour lookahead window in today's date
    today = now.date()
    window_start_dt = now + timedelta(minutes=5)   # 5-min buffer to avoid duplicate sends
    window_end_dt = now + timedelta(hours=1)

    with SessionLocal() as session:
        pickups_today = session.execute(
            select(PickupRequest, User).join(User, User.id == PickupRequest.user_id).where(
                PickupRequest.scheduled_date == today,
                PickupRequest.status.in_(["pending", "assigned", "in_progress"]),
            )
        ).all()

        for pickup, user in pickups_today:
            # Combine scheduled_date + scheduled_time into a UTC datetime for comparison
            # (stored times are treated as local; for a municipal app this approximation is acceptable)
            scheduled_dt = datetime.combine(pickup.scheduled_date, pickup.scheduled_time, tzinfo=timezone.utc)
            if window_start_dt <= scheduled_dt <= window_end_dt:
                if not user.phone:
                    continue
                minutes_away = int((scheduled_dt - now).total_seconds() / 60)
                msg = (
                    f"EcoSync Alert: Your {pickup.waste_type} waste pickup is arriving in "
                    f"~{minutes_away} minutes. Please bring your waste to the collection point."
                )
                try:
                    send_twilio_sms(user.phone, msg)
                except Exception as exc:  # noqa: BLE001
                    print(f"[reminder] Hour-before SMS failed for user {user.id}: {exc}")
