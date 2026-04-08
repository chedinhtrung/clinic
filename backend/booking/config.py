import os

DB_URL = os.environ.get("BOOKING_DB_URL")
VNPAY_TMN_CODE = os.environ.get("VNPAY_TMN_CODE")
VNPAY_HASH_SECRET = os.environ.get("VNPAY_HASH_SECRET")
VNPAY_PAYMENT_URL = os.environ.get("VNPAY_PAYMENT_URL")
VNPAY_RETURN_URL = os.environ.get("VNPAY_RETURN_URL")  # TODO: set your public VNPay return URL
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
# Use the real sender mailbox here, for example no-reply@yourdomain.com.
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", SMTP_USERNAME)
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "Phòng khám BS. Chế Đình Nghĩa")
# This should be the mailbox password or provider-specific app password for
# SMTP_USERNAME. For Gmail/Google Workspace, use an App Password instead of the
# normal account login password.
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").strip().lower() not in {"0", "false", "no"}
