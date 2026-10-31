from collections.abc import Generator

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine_kwargs = {"connect_args": connect_args}
if settings.database_url.startswith("sqlite") and (":memory:" in settings.database_url or settings.database_url == "sqlite://"):
    from sqlalchemy.pool import StaticPool
    engine_kwargs["poolclass"] = StaticPool
else:
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(settings.database_url, **engine_kwargs)

if settings.database_url.startswith("sqlite") and settings.database_url not in ("sqlite://", "sqlite:///:memory:"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def ensure_schema_compatibility(eng) -> None:
    """Safely apply additive columns for users and otp_challenges across environments without breaking migrations."""
    try:
        inspector = inspect(eng)
        table_names = set(inspector.get_table_names())
        is_pg = "postgresql" in str(eng.url) or "postgres" in str(eng.url)
        bool_type = "BOOLEAN DEFAULT FALSE" if is_pg else "BOOLEAN DEFAULT 0"
        datetime_type = "TIMESTAMP" if is_pg else "DATETIME"
        float_type = "DOUBLE PRECISION" if is_pg else "FLOAT"
        
        if "users" in table_names:
            cols = {c["name"]: c for c in inspector.get_columns("users")}
            columns_to_add = [
                ("phone_verified", bool_type),
                ("email_verified", bool_type),
                ("profile_completed", bool_type),
                ("house_flat_number", "VARCHAR(120)"),
                ("street_colony", "VARCHAR(255)"),
                ("locality", "VARCHAR(120)"),
                ("landmark", "VARCHAR(255)"),
                ("ward_number", "VARCHAR(50)"),
                ("pincode", "VARCHAR(10)"),
                ("latitude", float_type),
                ("longitude", float_type),
                ("failed_login_attempts", "INTEGER DEFAULT 0"),
                ("locked_until", datetime_type),
                ("email_verification_token", "VARCHAR(128)"),
                ("password_reset_token", "VARCHAR(128)"),
                ("password_reset_token_expires_at", datetime_type),
            ]
            for col_name, col_type in columns_to_add:
                if col_name not in cols:
                    try:
                        with eng.begin() as conn:
                            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass

            if is_pg:
                for col_name in ["phone", "password_hash"]:
                    col_info = cols.get(col_name)
                    if col_info and not col_info.get("nullable", True):
                        try:
                            with eng.begin() as conn:
                                conn.execute(text(f"ALTER TABLE users ALTER COLUMN {col_name} DROP NOT NULL"))
                        except Exception:
                            pass

            # In SQLite, if older table had phone or password_hash as NOT NULL, relax it
            if str(eng.url).startswith("sqlite"):
                    phone_col = cols.get("phone")
                    if phone_col and not phone_col.get("nullable", True):
                        try:
                            conn.execute(text("PRAGMA foreign_keys=OFF"))
                            conn.execute(text("""
                            CREATE TABLE IF NOT EXISTS users_compat (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                name VARCHAR(120),
                                phone VARCHAR(30) UNIQUE,
                                email VARCHAR(255) UNIQUE,
                                password_hash VARCHAR(255),
                                role VARCHAR(8) NOT NULL,
                                address TEXT,
                                verified BOOLEAN NOT NULL DEFAULT 0,
                                phone_verified BOOLEAN NOT NULL DEFAULT 0,
                                email_verified BOOLEAN NOT NULL DEFAULT 0,
                                profile_completed BOOLEAN NOT NULL DEFAULT 0,
                                house_flat_number VARCHAR(120),
                                street_colony VARCHAR(255),
                                locality VARCHAR(120),
                                landmark VARCHAR(255),
                                ward_number VARCHAR(50),
                                pincode VARCHAR(10),
                                latitude FLOAT,
                                longitude FLOAT,
                                household_id VARCHAR(64) UNIQUE,
                                electricity_bill_path VARCHAR(512),
                                zone_id INTEGER,
                                locale_preference VARCHAR(10) DEFAULT 'en',
                                failed_login_attempts INTEGER DEFAULT 0,
                                locked_until DATETIME,
                                email_verification_token VARCHAR(128),
                                password_reset_token VARCHAR(128),
                                password_reset_token_expires_at DATETIME,
                                created_at DATETIME,
                                updated_at DATETIME
                            )
                            """))
                            conn.execute(text("""
                            INSERT OR IGNORE INTO users_compat SELECT 
                                id, name, phone, email, password_hash, role, address, verified, 
                                phone_verified, email_verified, profile_completed, 
                                house_flat_number, street_colony, locality, landmark, ward_number, pincode, 
                                latitude, longitude, household_id, electricity_bill_path, zone_id, 
                                locale_preference, failed_login_attempts, locked_until, 
                                email_verification_token, password_reset_token, password_reset_token_expires_at, 
                                created_at, updated_at 
                            FROM users
                            """))
                            conn.execute(text("DROP TABLE users"))
                            conn.execute(text("ALTER TABLE users_compat RENAME TO users"))
                            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_phone ON users (phone)"))
                            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)"))
                            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_id ON users (id)"))
                            conn.execute(text("PRAGMA foreign_keys=ON"))
                        except Exception:
                            pass

        if "otp_challenges" in table_names:
            otp_cols = {c["name"] for c in inspector.get_columns("otp_challenges")}
            if "attempts" not in otp_cols:
                with eng.begin() as conn:
                    try:
                        conn.execute(text("ALTER TABLE otp_challenges ADD COLUMN attempts INTEGER DEFAULT 0 NOT NULL"))
                    except Exception:
                        pass
    except Exception:
        pass


ensure_schema_compatibility(engine)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
