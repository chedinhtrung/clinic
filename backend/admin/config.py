import os

from psycopg_pool import ConnectionPool


DB_URL = os.environ.get("BOOKING_DB_URL")
DB_POOL_MIN_SIZE = int(os.environ.get("ADMIN_DB_POOL_MIN_SIZE", "1"))
DB_POOL_MAX_SIZE = int(os.environ.get("ADMIN_DB_POOL_MAX_SIZE", "10"))

if not DB_URL:
    raise RuntimeError("BOOKING_DB_URL environment variable is not set")


# The admin API writes to the same bookings database that the public booking
# flow reads from, so slot changes become visible to patients immediately.
DB_POOL = ConnectionPool(
    conninfo=DB_URL,
    min_size=DB_POOL_MIN_SIZE,
    max_size=DB_POOL_MAX_SIZE,
)
