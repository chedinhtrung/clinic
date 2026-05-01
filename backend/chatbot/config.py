import os

BOOKING_DB_URL = os.environ.get("BOOKING_DB_URL")
CHAT_TOKEN_SECRET = os.environ.get("CHAT_TOKEN_SECRET")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_CHAT_MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4.1-mini")
