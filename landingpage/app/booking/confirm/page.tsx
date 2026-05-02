"use client"

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { withApiBase } from "@/app/apiBase";
import Navbar from "@/components/Navbar";

type ConfirmationStatus = "loading" | "success" | "error";

function BookingConfirmContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id") ?? "";
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [message, setMessage] = useState("Đang xác nhận lịch hẹn của bạn...");
  const [reservationCode, setReservationCode] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !token) {
      setStatus("error");
      setMessage("Link xác nhận không hợp lệ hoặc thiếu thông tin.");
      return;
    }

    let isCurrent = true;

    async function confirmBooking() {
      try {
        const query = new URLSearchParams({
          booking_id: bookingId,
          token,
        });
        const res = await fetch(withApiBase(`/api/booking/confirm?${query.toString()}`), {
          method: "GET",
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error ?? "Không thể xác nhận lịch hẹn. Vui lòng thử lại hoặc liên hệ phòng khám.");
        }

        if (!isCurrent) {
          return;
        }

        setReservationCode(data?.result?.reservationCode ?? null);
        setStatus("success");
        const chatLink = data?.result?.chatLink;

        if (typeof chatLink === "string" && chatLink.trim()) {
          window.location.assign(chatLink);
          return;
        }

        setMessage(
          data?.result?.confirmationEmailSent
            ? "Lịch hẹn của bạn đã được xác nhận thành công. Một email xác nhận khác đã được gửi đến hộp thư của bạn."
            : "Lịch hẹn của bạn đã được xác nhận thành công. Nếu bạn chưa nhận được email xác nhận, vui lòng kiểm tra lại hộp thư sau ít phút."
        );
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Không thể xác nhận lịch hẹn. Vui lòng liên hệ trực tiếp với phòng khám qua email coxuongkhop.bsnghia@gmail.com để được hỗ trợ ngay.");
      }
    }

    confirmBooking();

    return () => {
      isCurrent = false;
    };
  }, [bookingId, token]);

  return (
    <main className="min-h-[70vh] bg-tinted-gray px-6 py-14 sm:px-10">
      <section className="mx-auto w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase text-primary">
          {status === "loading" ? "Đang xử lý" : status === "success" ? "Xác nhận thành công" : "Không thể xác nhận"}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-primary">XÁC NHẬN LỊCH HẸN</h1>
        <p className="mt-4 text-txt-gray">{message}</p>

        {reservationCode ? (
          <p className="mt-4 text-sm text-txt-gray">
            Mã đặt chỗ: <span className="font-semibold text-black">{reservationCode}</span>
          </p>
        ) : null}

        {status === "success" ? (
          <p className="mt-4 text-sm text-txt-gray">
            Vui lòng kiểm tra email để xem thông tin lịch hẹn và đường dẫn thay đổi hoặc hủy lịch nếu cần.
          </p>
        ) : null}
        <p>
          Sau khi xác nhận thành công, bạn sẽ được chuyển hướng đến trợ lý của BS. Nghĩa để thảo luận chi tiết về tình trạng của bạn và các bước tiếp theo. Nếu bạn không được chuyển hướng tự động, vui lòng nhấp vào liên kết trong email xác nhận hoặc liên hệ trực tiếp với phòng khám qua email coxuongkhop.bsnghia@gmail.com để được hỗ trợ ngay.
        </p>
      </section>
    </main>
  );
}

export default function BookingConfirmPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-[70vh] bg-tinted-gray p-6 sm:p-10" />}>
        <BookingConfirmContent />
      </Suspense>
    </>
  );
}
