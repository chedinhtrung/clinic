import os

DB_URL = os.environ.get("BOOKING_DB_URL")
VNPAY_TMN_CODE = os.environ.get("VNPAY_TMN_CODE")
VNPAY_HASH_SECRET = os.environ.get("VNPAY_HASH_SECRET")
VNPAY_PAYMENT_URL = os.environ.get("VNPAY_PAYMENT_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html")
VNPAY_RETURN_URL = os.environ.get("VNPAY_RETURN_URL")  # TODO: set your public VNPay return URL

print("VNPAY Settings")
print(VNPAY_HASH_SECRET)
print(VNPAY_PAYMENT_URL)
print(VNPAY_RETURN_URL)
print(VNPAY_TMN_CODE)