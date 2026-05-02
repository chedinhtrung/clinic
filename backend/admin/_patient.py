from typing import Any

from config import DB_POOL


def db_search_patients(*, query: str, limit: int = 50) -> list[dict[str, Any]]:
    normalized_query = query.strip()
    if not normalized_query:
        return []
    if limit < 1 or limit > 200:
        raise ValueError("limit must be between 1 and 200")

    search_like = f"%{normalized_query}%"
    try:
        patient_code = int(normalized_query)
    except ValueError:
        patient_code = None

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, birthdate, registration_date, phone
                FROM patients
                WHERE name ILIKE %s
                   OR phone ILIKE %s
                   OR CAST(id AS text) = %s
                   OR patient_code = COALESCE(%s::bigint, -1)
                ORDER BY registration_date DESC, id ASC
                LIMIT %s
                """,
                (search_like, search_like, normalized_query, patient_code, limit),
            )
            rows = cur.fetchall()

    return [
        {
            "id": str(row[0]),
            "name": row[1],
            "birthdate": row[2].isoformat() if row[2] else None,
            "registrationDate": row[3].isoformat() if row[3] else None,
            "phone": row[4],
        }
        for row in rows
    ]


def db_get_patient(*, patient_id: str) -> dict[str, Any]:
    if not patient_id:
        raise ValueError("patient_id is required")

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, patient_code, name, birthdate, gender, email, phone, registration_date, ai_summary, notes
                FROM patients
                WHERE id = %s
                LIMIT 1
                """,
                (patient_id,),
            )
            row = cur.fetchone()

    if row is None:
        raise ValueError("patient not found")

    return {
        "id": str(row[0]),
        "patientCode": row[1],
        "name": row[2],
        "birthdate": row[3].isoformat() if row[3] else None,
        "gender": row[4],
        "email": row[5],
        "phone": row[6],
        "registrationDate": row[7].isoformat() if row[7] else None,
        "aiSummary": row[8],
        "notes": row[9],
    }


def db_update_patient_notes(*, patient_id: str, notes: str) -> dict[str, Any]:
    if not patient_id:
        raise ValueError("patient_id is required")

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE patients
                    SET notes = %s
                    WHERE id = %s
                    RETURNING id, notes
                    """,
                    (notes, patient_id),
                )
                row = cur.fetchone()

    if row is None:
        raise ValueError("patient not found")

    return {
        "id": str(row[0]),
        "notes": row[1],
    }


def db_get_patient_bookings(*, patient_id: str) -> list[dict[str, Any]]:
    if not patient_id:
        raise ValueError("patient_id is required")

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT b.id, b.reservation_code, b.status, b.created_at, b.confirmed_at, b.expires_at,
                       s.start_at, s.end_at
                FROM bookings b
                JOIN slots s ON s.id = b.slot_id
                WHERE b.patient_id = %s
                  AND b.status IN ('pending', 'confirmed', 'finished')
                ORDER BY s.start_at DESC, b.created_at DESC
                """,
                (patient_id,),
            )
            rows = cur.fetchall()

    return [
        {
            "id": str(row[0]),
            "reservationCode": row[1],
            "status": row[2],
            "createdAt": row[3].isoformat() if row[3] else None,
            "confirmedAt": row[4].isoformat() if row[4] else None,
            "expiresAt": row[5].isoformat() if row[5] else None,
            "startAt": row[6].isoformat() if row[6] else None,
            "endAt": row[7].isoformat() if row[7] else None,
        }
        for row in rows
    ]


def db_get_patients_page(*, page: int, page_size: int, sort_by: str, sort_order: str) -> dict[str, Any]:
    if page < 1:
        raise ValueError("page must be >= 1")
    if page_size < 1 or page_size > 200:
        raise ValueError("pageSize must be between 1 and 200")

    allowed_sort_columns = {
        "name": "name",
        "registration_date": "registration_date",
    }
    if sort_by not in allowed_sort_columns:
        raise ValueError("sortBy must be one of: name, registration_date")

    normalized_sort_order = sort_order.lower()
    if normalized_sort_order not in ("asc", "desc"):
        raise ValueError("sortOrder must be 'asc' or 'desc'")

    order_column = allowed_sort_columns[sort_by]
    offset = (page - 1) * page_size

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM patients")
            total_patients = int(cur.fetchone()[0] or 0)

            # Sorting is limited to a hardcoded allow-list to prevent SQL injection.
            query = f"""
                SELECT id, name, birthdate, registration_date, phone
                FROM patients
                ORDER BY {order_column} {normalized_sort_order}, id ASC
                LIMIT %s OFFSET %s
            """
            cur.execute(query, (page_size, offset))
            rows = cur.fetchall()

    total_pages = max(1, (total_patients + page_size - 1) // page_size)
    clamped_page = min(page, total_pages)

    return {
        "patients": [
            {
                "id": str(row[0]),
                "name": row[1],
                "birthdate": row[2].isoformat() if row[2] else None,
                "registrationDate": row[3].isoformat() if row[3] else None,
                "phone": row[4],
            }
            for row in rows
        ],
        "page": clamped_page,
        "pageSize": page_size,
        "totalPatients": total_patients,
        "totalPages": total_pages,
    }
