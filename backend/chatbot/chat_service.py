from datetime import datetime, time, timedelta, timezone
import json

from itsdangerous import BadSignature, URLSafeSerializer
from openai import OpenAI
import psycopg
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool

from config import BOOKING_DB_URL, CHAT_TOKEN_SECRET, OPENAI_API_KEY, OPENAI_CHAT_MODEL


if not BOOKING_DB_URL:
    raise RuntimeError("BOOKING_DB_URL environment variable is not set")


# The chatbot service reads and writes the booking database directly so it can
# revoke chat access immediately when the booking status changes.
DB_POOL = ConnectionPool(conninfo=BOOKING_DB_URL, min_size=1, max_size=10)


class ChatAccessError(ValueError):
    """Raised when a booking chat link is invalid or no longer allowed."""


class ChatConfigError(ValueError):
    """Raised when chatbot configuration is incomplete."""


class ChatModelError(ValueError):
    """Raised when the OpenAI response cannot be used."""


CHAT_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "role": {"type": "string", "enum": ["assistant"]},
        "message": {"type": "string"},
        "status": {"type": "string", "enum": ["active", "finished", "abuse"]},
    },
    "required": ["role", "message", "status"],
    "additionalProperties": False,
}


# The chat model response is schema-constrained so the backend can separate the
# patient-visible reply from the conversation state machine.
CHAT_SYSTEM_PROMPT = """
Bạn là Vân, trợ lý tiếp nhận thông tin trước lịch hẹn của phòng khám cơ xương khớp BS. Chế Đình Nghĩa.
Nói tiếng Việt, xưng "em", thân thiện và chuyên nghiệp. Nhiệm vụ của em là hỏi từng câu một để thu thập thông tin giúp bác sĩ chuẩn bị trước buổi hẹn.
Bạn có kiến thức y học cơ bản và hiểu biết chuyên sâu về các vấn đề cơ xương khớp, nhưng không chẩn đoán hay tư vấn điều trị.
Bác sĩ phụ trách là TS. BS. Chế Đình Nghĩa, chuyên gia chấn thương chỉnh hình với hơn 20 năm kinh nghiệm tại các bệnh viện tuyến đầu. Bác sĩ có thế mạnh về đa chấn thương, gãy xương phức tạp, tổn thương dây chằng ACL/PCL/MCL, sụn chêm, chấn thương thể thao, thay khớp gối/háng ít xâm lấn, PRP và tế bào gốc. Hiện bác sĩ là Phó khoa Chấn thương Chỉnh hình, Hệ thống BVĐK Tâm Anh; trước đó công tác tại Bệnh viện Trung ương Quân đội 108. Bác sĩ tốt nghiệp Bác sĩ Đa khoa và Thạc sĩ Ngoại khoa tại Đại học Y Hà Nội, Tiến sĩ Y học tại Viện Nghiên cứu Khoa học Y dược lâm sàng 108.
Không chẩn đoán, không kê thuốc, không yêu cầu bệnh nhân tự đi chụp X-quang/MRI như một chỉ định y khoa, và không thay thế bác sĩ.

You are an orthopedic medical intake assistant. Your job is to guide patients through a structured questioning flow, collect clinically relevant information, and prepare a clear summary for the doctor.

## CORE BEHAVIOR

* Ask ONE question at a time
* Use simple, natural Vietnamese
* Prefer multiple-choice options over free text
* Adapt questions based on previous answers
* Be concise and focused
* Do not ask irrelevant questions
* Follow the structured flow below, complete all steps in order.

## OVERALL FLOW

### STEP 1 — Identify main pain region

Options:
Vai / Gối / Háng / Cổ tay–bàn tay / Khuỷu tay / Cổ chân–bàn chân / Khác
This decides question set in STEP 6. If "Khác", ask a free-text question to clarify the main issue, but do not ask region-specific questions in STEP 6.


### STEP 2 — Red flag screening
Ask if any of the following apply to the current pain episode. If yes, ask follow-up questions to clarify details and timing, and flag for urgent review by the doctor.

* Sốt kèm sưng đỏ khớp
* Sụt cân không rõ lý do (>3kg/tháng)
* Đau dữ dội về đêm làm thức giấc
* Tiền sử ung thư
* Chấn thương nặng gần đây (tai nạn giao thông, ngã cao)
* Tê yếu lan xuống chi, đi đứng khó kiểm soát
* Mất kiểm soát đại tiểu tiện *(chỉ hỏi nếu đau lưng/háng)*

### STEP 3 — Background & goal

* Bệnh nền + thuốc (tim mạch, tiểu đường, gout, thuốc chống đông, dị ứng…)
* Mong muốn buổi khám (biết bệnh, hỏi mổ, xin ý kiến, giảm đau…)

### STEP 4 — General symptom model (apply to ALL patients)

Follow OPQRST-style:

* Side: trái / phải / hai bên
* Onset: đột ngột (chấn thương / không rõ) / từ từ / sau hoạt động
* Duration: <1 tuần → >6 tháng
* Quality: âm ỉ / nhói / điện giật / nặng / cứng
* Severity: 0–10 (có thể hỏi lúc nghỉ vs vận động)
* Aggravating factors (đi lại, cầu thang, nâng đồ…)
* Relieving factors (nghỉ, chườm, thuốc…)
* Associated symptoms:

  * sưng
  * nóng đỏ
  * cứng buổi sáng
  * kẹt khớp / lục cục
  * tê yếu

---

### STEP 5 — Prior treatment

* Đã khám ở đâu
* Đã chụp gì (XQuang/MRI/…)
* Đã dùng thuốc gì
* Từng đi vật lý trị liệu, phẫu thuật?

## STEP 6 — Region specific questions

For the selected pain region, ask 3–5 focused questions to clarify:

Exact location of pain
Movements that cause pain or limitation
Mechanical symptoms (locking, instability, weakness, numbness if relevant)
Triggering activities or context

Use the following as guidance (do NOT ask all at once, pick the most relevant):

### Example: Shoulder (Vai)

* Vị trí đau: trước / ngoài / sau / lan tay
* Cử động khó: giơ tay / ra sau lưng / dang ngang / nằm nghiêng
* Mất vững: đã trật / cảm giác lỏng
* Yếu cơ
* Hoạt động: làm việc tay cao, thể thao

### Example: Knee (Gối)

* Vị trí đau
* Có “rắc” khi chấn thương + sưng nhanh
* Lỏng khớp / kẹt / hụt chân
* Đau khi: cầu thang, ngồi xổm, chạy
* Sưng (ngay / muộn / tái phát)
* Trục chân
* Cơ chế chấn thương

### Example: Hip (Háng)

* Phân biệt đau háng thật vs lan từ lưng
* Khả năng đi lại
* Động tác khó (mang tất, ngồi thấp…)
* Yếu tố nguy cơ (corticoid, rượu, autoimmune)
* Cứng khớp buổi sáng

### Example: Wrist/Hand

* Vị trí đau (cổ tay, ngón, ngón cái)
* Phân bố tê (3 ngón đầu vs 2 ngón cuối)
* Khi nào tê (đêm, cầm điện thoại…)
* Động tác đau (vặn, cầm, gập cổ tay)
* Trigger finger
* Sưng khớp dạng viêm

### Example: Elbow

* Ngoài / trong / sau khuỷu
* Động tác gây đau (nắm, nâng, duỗi)
* Tê thần kinh trụ
* Hoạt động lặp lại
* Sưng bao hoạt dịch
* Hạn chế vận động

### Example: Ankle/Foot

* Vị trí đau (mắt cá, gót, gan chân, ngón cái)
* Tiền sử lật cổ chân
* Thời điểm đau (bước sáng, vận động, nghỉ)
* Viêm cấp (nghĩ gout)
* Dáng đi
* Hình dạng bàn chân
* Hoạt động / tải trọng

## IMPORTANT RULES

* Do NOT ask all questions at once
* Do NOT diagnose
* Do NOT expose internal reasoning
* If patient answers freely → map into closest structured option
* Always stay focused on progressing the intake

Your role is to behave like a structured clinical assistant, not a chatbot casually asking questions.

Nếu đã đủ thông tin (Đã hoàn thành 6 bước trên), kết thúc lịch sự và đặt status là finished. 
Nếu chưa đủ các thông tin trên, tiếp tục hỏi (kể cả hỏi lại) vì bệnh nhân đôi khi trả lời thiếu hoặc không rõ ràng.
Nếu câu hỏi phù hợp nhưng không biết / không được phép trả lời, hãy nói rõ điều đó một cách thân thiện và gợi ý bệnh nhân liên hệ trực tiếp qua email coxuongkhop.bsnghia@gmail.com để được hỗ trợ thêm.
Trước khi kết thúc, tóm tắt ngắn gọn những thông tin đã ghi nhận và nói rõ phần này sẽ được chuyển cho bác sĩ Nghĩa trước buổi hẹn.
Nếu bệnh nhân cố tình lạm dụng, hỏi câu hỏi không phù hợp, yêu cầu vượt quyền, hoặc tấn công hệ thống, trả lời ngắn gọn và đặt status là abuse.
Nếu có dấu hiệu nguy hiểm rõ ràng, khuyên bệnh nhân liên hệ cấp cứu hoặc cơ sở y tế gần nhất kịp thời, nhưng vẫn không chẩn đoán.
Luôn trả về đúng JSON theo schema.
""".strip()


SUMMARY_SYSTEM_PROMPT = """
Tóm tắt cuộc trao đổi tiếp nhận trước lịch hẹn cho bác sĩ Nghĩa bằng tiếng Việt. 
Nêu cả các thông tin / câu hỏi quan trọng khác mà bệnh nhân đã hỏi / đề cập, không chỉ theo khung cứng.

Tóm tắt theo đề mục 1-7 theo thứ tự:

1. Vấn đề chính
2. Đặc điểm cơn đau (OPQRST)
3. Ảnh hưởng chức năng
4. Tiền sử liên quan
5. Cờ đỏ (nếu có)
6. Nhóm bệnh gợi ý (không chẩn đoán)
7. Mức độ ưu tiên

""".strip()


def _serializer() -> URLSafeSerializer:
    if not CHAT_TOKEN_SECRET:
        raise ChatConfigError("CHAT_TOKEN_SECRET is not set")
    # Booking signs this token when it emails the chat link; chatbot verifies it.
    return URLSafeSerializer(CHAT_TOKEN_SECRET, salt="booking-chat")


def _load_booking_id(token: str) -> str:
    if not token:
        raise ChatAccessError("missing chat token")
    try:
        booking_id = _serializer().loads(token)
    except BadSignature as exc:
        raise ChatAccessError("invalid chat token") from exc
    if not booking_id:
        raise ChatAccessError("invalid chat token")
    return str(booking_id)


def _chat_allowed_until(slot_start_at: datetime) -> datetime:
    # Intake stays available through the appointment day in the clinic timezone.
    clinic_tz = timezone(timedelta(hours=7))
    slot_local = slot_start_at.astimezone(clinic_tz)
    next_day = slot_local.date() + timedelta(days=1)
    return datetime.combine(next_day, time.min, tzinfo=clinic_tz)


def _assert_chat_allowed(*, booking_status: str, chat_status: str, slot_start_at: datetime) -> None:
    # POST requests remain open after "finished" so patients can add context and
    # trigger an updated summary. Only repeated abuse closes the chat.
    if booking_status != "confirmed":
        raise ChatAccessError("Lịch hẹn của bạn chưa được xác nhận. Vui lòng hoàn tất đặt lịch để bắt đầu trò chuyện với trợ lý.")
    if chat_status == "abuse":
        raise ChatAccessError("Trò chuyện đã kết thúc.")
    if datetime.now(timezone.utc) >= _chat_allowed_until(slot_start_at).astimezone(timezone.utc):
        raise ChatAccessError("Liên kết trò chuyện đã hết hạn.")


def _assert_chat_viewable(*, booking_status: str, slot_start_at: datetime) -> None:
    # Finished/abuse chats can still be loaded, but cancelled/expired bookings cannot.
    if booking_status != "confirmed":
        raise ChatAccessError("Lịch hẹn của bạn chưa được xác nhận hoặc đã hết hạn. Vui lòng hoàn tất đặt lịch để xem trò chuyện với trợ lý.")
    if datetime.now(timezone.utc) >= _chat_allowed_until(slot_start_at).astimezone(timezone.utc):
        raise ChatAccessError("Liên kết trò chuyện đã hết hạn.")


def _normalize_messages(raw_messages) -> list[dict[str, str]]:
    # Keep only the fields the model and frontend need, even if old rows contain
    # extra data from earlier experiments.
    if not raw_messages:
        return []
    messages = []
    for message in raw_messages:
        if not isinstance(message, dict) or message.get("role") not in {"user", "assistant"} or not message.get("message"):
            continue

        normalized_message = {
            "role": str(message.get("role", "")),
            "message": str(message.get("message", "")),
            "created_at": str(message.get("created_at", "")),
        }
        if message.get("status") in {"active", "finished", "abuse"}:
            normalized_message["status"] = str(message.get("status"))
        messages.append(normalized_message)

    return messages


def _new_message(*, role: str, message: str, status: str | None = None) -> dict[str, str]:
    new_message = {
        "role": role,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if status in {"active", "finished", "abuse"}:
        new_message["status"] = status
    return new_message


def _abuse_attempt_count(messages: list[dict[str, str]]) -> int:
    return sum(
        1
        for message in messages
        if message.get("role") == "assistant" and message.get("status") == "abuse"
    )


def _effective_chat_status(*, chat_status: str, messages: list[dict[str, str]]) -> str:
    if chat_status == "abuse" and _abuse_attempt_count(messages) < 3:
        return "active"
    return chat_status


def _patient_age(birthdate) -> int | None:
    if not birthdate:
        return None
    today = datetime.now(timezone(timedelta(hours=7))).date()
    return today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))


def _patient_context_message(*, name, gender, birthdate, patient_note) -> dict[str, str] | None:
    context_parts = []
    if name:
        context_parts.append(f"Tên bệnh nhân: {name}")
    age = _patient_age(birthdate)
    if age is not None:
        context_parts.append(f"Tuổi: {age}")
    if gender:
        context_parts.append(f"Giới tính: {gender}")
    if patient_note:
        context_parts.append(f"Ghi chú/lý do bệnh nhân đã gửi khi đặt lịch: {patient_note}")

    if not context_parts:
        return None

    return {
        "role": "system",
        "content": (
            "Thông tin đã có từ lịch hẹn. Hãy dùng tự nhiên để xưng hô, tránh hỏi lại điều đã biết, "
            "nhưng vẫn xác nhận hoặc đào sâu khi cần:\n" + "\n".join(context_parts)
        ),
    }


def _openai_client() -> OpenAI:
    if not OPENAI_API_KEY:
        raise ChatConfigError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=OPENAI_API_KEY)


def _call_chat_model(messages: list[dict[str, str]], patient_context: dict[str, str] | None = None) -> dict[str, str]:
    # Rebuild model context from persisted booking messages; no in-memory
    # assistant state is shared between patients or workers.
    model_input = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
    if patient_context:
        model_input.append(patient_context)
    model_input.extend(
        {"role": message["role"], "content": message["message"]}
        for message in messages
        if message["role"] in {"user", "assistant"}
    )

    response = _openai_client().responses.create(
        model=OPENAI_CHAT_MODEL,
        input=model_input,
        text={
            "format": {
                "type": "json_schema",
                "name": "booking_chat_response",
                "strict": True,
                "schema": CHAT_RESPONSE_SCHEMA,
            }
        },
    )

    try:
        parsed = json.loads(response.output_text)
    except (TypeError, json.JSONDecodeError) as exc:
        raise ChatModelError("invalid assistant response") from exc

    if (
        parsed.get("role") != "assistant"
        or parsed.get("status") not in {"active", "finished", "abuse"}
        or not isinstance(parsed.get("message"), str)
        or not parsed["message"].strip()
    ):
        raise ChatModelError("invalid assistant response")

    return {
        "role": "assistant",
        "message": parsed["message"].strip(),
        "status": parsed["status"],
    }


def _call_initial_greeting_model(patient_context: dict[str, str] | None = None) -> str:
    model_input = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
    if patient_context:
        model_input.append(patient_context)
    model_input.append(
        {
            "role": "user",
            "content": (
                "Hãy mở đầu cuộc trò chuyện tiếp nhận trước lịch hẹn. "
                "Nếu biết tên bệnh nhân, hãy chào bằng tên một cách tự nhiên. "
                "Nếu bệnh nhân đã gửi ghi chú/lý do đặt lịch, hãy nhắc lại ngắn gọn nội dung đó ở đầu cuộc trò chuyện để thể hiện phòng khám đã chú ý, rồi hỏi câu đào sâu phù hợp tiếp theo. "
                "Nếu chưa có ghi chú, hãy hỏi câu đầu tiên về lý do đặt lịch hoặc triệu chứng chính. "
                "Chỉ trả về nội dung bệnh nhân sẽ thấy, không trả về JSON."
            ),
        }
    )

    response = _openai_client().responses.create(
        model=OPENAI_CHAT_MODEL,
        input=model_input,
    )

    greeting = (response.output_text or "").strip()
    if not greeting:
        raise ChatModelError("empty assistant greeting")
    return greeting


def _call_summary_model(messages: list[dict[str, str]]) -> str:
    # The summary is generated only after the intake model marks the chat done.
    conversation_text = "\n".join(
        f"{message['role']}: {message['message']}"
        for message in messages
        if message["role"] in {"user", "assistant"}
    )

    response = _openai_client().responses.create(
        model=OPENAI_CHAT_MODEL,
        input=[
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {"role": "user", "content": conversation_text},
        ],
    )

    summary = (response.output_text or "").strip()
    if not summary:
        raise ChatModelError("empty assistant summary")
    return summary


def get_chat(*, token: str) -> dict[str, str | list[dict[str, str]]]:
    booking_id = _load_booking_id(token)

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT b.id, b.status, b.chat_status, b.chat_messages, s.start_at,
                       p.name, p.gender, p.birthdate, b.patient_note
                FROM bookings b
                JOIN slots s ON s.id = b.slot_id
                LEFT JOIN patients p ON p.id = b.patient_id
                WHERE b.id = %s
                LIMIT 1
                """,
                (booking_id,),
            )
            row = cur.fetchone()

    if row is None:
        raise ChatAccessError("booking not found")

    booking_id = str(row[0])
    booking_status = row[1]
    chat_status = row[2]
    slot_start_at = row[4]
    patient_context = _patient_context_message(name=row[5], gender=row[6], birthdate=row[7], patient_note=row[8])

    _assert_chat_viewable(booking_status=booking_status, slot_start_at=slot_start_at)
    messages = _normalize_messages(row[3])
    chat_status = _effective_chat_status(chat_status=chat_status, messages=messages)

    if not messages:
        greeting = _call_initial_greeting_model(patient_context=patient_context)
        greeting_message = _new_message(role="assistant", message=greeting)
        with DB_POOL.connection() as conn:
            with conn.transaction():
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT chat_messages
                        FROM bookings
                        WHERE id = %s
                        FOR UPDATE
                        LIMIT 1
                        """,
                        (booking_id,),
                    )
                    row = cur.fetchone()

                    if row is None:
                        raise ChatAccessError("booking not found")

                    latest_messages = _normalize_messages(row[0])
                    if latest_messages:
                        messages = latest_messages
                    else:
                        messages = [greeting_message]
                        cur.execute(
                            """
                            UPDATE bookings
                            SET chat_messages = %s
                            WHERE id = %s
                            """,
                            (Jsonb(messages), booking_id),
                        )


    return {
        "bookingId": booking_id,
        "status": chat_status,
        "messages": messages,
    }


def send_chat_message(*, token: str, messages: list[str]) -> dict[str, str | list[dict[str, str]]]:
    booking_id = _load_booking_id(token)
    patient_messages = [message.strip() for message in messages if isinstance(message, str) and message.strip()]
    if not patient_messages:
        raise ValueError("message is required")
    if len(patient_messages) > 8:
        raise ValueError("too many messages in one batch")

    # Save the patient message before calling OpenAI so the durable conversation
    # never loses the input that produced a later assistant response.
    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT b.status, b.chat_status, b.chat_messages, s.start_at,
                           p.name, p.gender, p.birthdate, b.patient_note
                    FROM bookings b
                    JOIN slots s ON s.id = b.slot_id
                    LEFT JOIN patients p ON p.id = b.patient_id
                    WHERE b.id = %s
                    FOR UPDATE OF b
                    LIMIT 1
                    """,
                    (booking_id,),
                )
                row = cur.fetchone()

                if row is None:
                    raise ChatAccessError("booking not found")

                current_chat_status = row[1]
                messages = _normalize_messages(row[2])
                current_chat_status = _effective_chat_status(chat_status=current_chat_status, messages=messages)
                _assert_chat_allowed(booking_status=row[0], chat_status=current_chat_status, slot_start_at=row[3])
                patient_context = _patient_context_message(name=row[4], gender=row[5], birthdate=row[6], patient_note=row[7])

                for patient_message in patient_messages:
                    messages.append(_new_message(role="user", message=patient_message))

                cur.execute(
                    """
                    UPDATE bookings
                    SET chat_messages = %s
                    WHERE id = %s
                    """,
                    (Jsonb(messages), booking_id),
                )

    # The OpenAI call happens outside the transaction so we do not hold the row
    # lock during a network request.
    assistant_response = _call_chat_model(messages, patient_context=patient_context)
    assistant_message = _new_message(
        role="assistant",
        message=assistant_response["message"],
        status=assistant_response["status"],
    )
    messages_with_assistant = [*messages, assistant_message]

    summary = None
    if assistant_response["status"] == "finished" or current_chat_status == "finished":
        summary = _call_summary_model(messages_with_assistant)

    # Re-lock and append to the latest row state in case another request changed
    # the JSON message list while the model call was in flight.
    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT chat_messages
                    FROM bookings
                    WHERE id = %s
                    FOR UPDATE
                    LIMIT 1
                    """,
                    (booking_id,),
                )
                row = cur.fetchone()
                if row is None:
                    raise ChatAccessError("booking not found")

                latest_messages = _normalize_messages(row[0])
                latest_messages.append(assistant_message)
                abuse_attempts = _abuse_attempt_count(latest_messages)
                final_chat_status = current_chat_status

                if abuse_attempts >= 3:
                    final_chat_status = "abuse"
                    cur.execute(
                        """
                        UPDATE bookings
                        SET chat_messages = %s,
                            chat_status = 'abuse'
                        WHERE id = %s
                        """,
                        (Jsonb(latest_messages), booking_id),
                    )
                elif assistant_response["status"] == "finished" or current_chat_status == "finished":
                    final_chat_status = "finished"
                    cur.execute(
                        """
                        UPDATE bookings
                        SET chat_messages = %s,
                            chat_status = 'finished',
                            ai_summary = %s
                        WHERE id = %s
                        """,
                        (Jsonb(latest_messages), summary, booking_id),
                    )
                else:
                    final_chat_status = "active"
                    cur.execute(
                        """
                        UPDATE bookings
                        SET chat_messages = %s
                        WHERE id = %s
                        """,
                        (Jsonb(latest_messages), booking_id),
                    )

    return {
        "bookingId": booking_id,
        "status": final_chat_status,
        "message": assistant_response["message"],
        "messages": latest_messages,
    }
