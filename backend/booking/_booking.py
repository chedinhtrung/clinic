from config import *
from datetime import date, datetime, time, timedelta
from secrets import token_urlsafe

import psycopg
from psycopg_pool import ConnectionPool


if not DB_URL:
    raise RuntimeError("BOOKING_DB_URL environment variable is not set")


# Reuse PostgreSQL connections across requests so we don't pay the cost of
# opening a brand new database connection on every API call.
DB_POOL = ConnectionPool(conninfo=DB_URL, min_size=1, max_size=10)


def create_booking_session_id() -> str:
    return token_urlsafe(32)


def db_get_available_dates() -> list[str]:
    query = """
        SELECT DISTINCT DATE(start_at) AS available_date
        FROM slots
        WHERE start_at >= date_trunc('day', now()) + interval '1 day'
        ORDER BY available_date ASC
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

    dates = [row[0].isoformat() for row in rows]
    print(dates)
    return dates


def db_get_available_slots(selected_date_raw: str) -> list[dict[str, str]]:
    selected_date = _parse_selected_date(selected_date_raw)
    day_start = datetime.combine(selected_date, time.min)
    day_end = day_start + timedelta(days=1)

    query = """
        SELECT start_at, end_at, id
        FROM slots
        WHERE start_at >= %s AND start_at < %s
        ORDER BY start_at ASC
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (day_start, day_end))
            rows = cur.fetchall()

    print(rows)
    return [
        {
            "from": row[0].strftime("%H:%M"),
            "to": row[1].strftime("%H:%M"),
            "id": str(row[2]),
        }
        for row in rows
    ]


def _parse_selected_date(selected_date_raw: str) -> date:
    if not selected_date_raw:
        raise ValueError("selected date is required")

    try:
        return date.fromisoformat(selected_date_raw)
    except ValueError as exc:
        raise ValueError("selected date must be a valid YYYY-MM-DD string") from exc
