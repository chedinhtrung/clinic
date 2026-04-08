"use client"

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CalendarSVG from "@/components/CalendarSVG";
import BookingChangeForm from "@/components/BookingChangeForm";

type BookingDetails = {
  id: string;
  reservationCode: number;
  status: string;
  slotId: string;
  expiresAt: string;
  confirmedAt?: string | null;
  startAt: string;
  endAt: string;
  patientId: string;
  patientName?: string | null;
  patientEmail?: string | null;
  patientPhone?: string | null;
  patientBirthdate?: string | null;
  patientGender?: string | null;
}

type BookingChangeFormValues = {
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: string;
}

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function BookingChangeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id") ?? "";
  const patientId = searchParams.get("patient_id") ?? "";
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !patientId) {
      setErrorMessage("Thiếu thông tin truy cập lịch hẹn");
      return;
    }

    async function loadBooking() {
      try {
        setErrorMessage(null);
        const query = new URLSearchParams({
          booking_id: bookingId,
          patient_id: patientId,
        });
        const res = await fetch(`/api/booking/change?${query.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error ?? "Không tìm thấy lịch hẹn này!");
        }

        setBooking(data.booking);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Không tìm thấy lịch hẹn");
      }
    }

    loadBooking();
  }, [bookingId, patientId]);

  async function handleUpdate(values: BookingChangeFormValues) {
    if (!bookingId || !patientId) {
      alert("Thiếu thông tin truy cập lịch hẹn.");
      return;
    }

    const query = new URLSearchParams({
      booking_id: bookingId,
      patient_id: patientId,
    });
    const res = await fetch(`/api/booking/change?${query.toString()}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error ?? "Không cập nhật được thông tin liên lạc.");
    }

    setBooking(data.booking);
    alert("Đã cập nhật thông tin liên lạc.");
  }

  async function handleDelete() {
    if (!bookingId || !patientId) {
      alert("Thiếu thông tin truy cập lịch hẹn");
      return;
    }

    const query = new URLSearchParams({
      booking_id: bookingId,
      patient_id: patientId,
    });
    const res = await fetch(`/api/booking/change?${query.toString()}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error ?? "KhÃ´ng há»§y Ä‘Æ°á»£c lá»‹ch háº¹n.");
    }

    alert("Không hủy được lịch hẹn. Vui lòng liên hệ Hotline để được hỗ trợ thêm.");
    router.push("/");
  }

  const startAt = booking?.startAt ? new Date(booking.startAt) : null;
  const endAt = booking?.endAt ? new Date(booking.endAt) : null;
  const from = startAt
    ? startAt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: getBrowserTimeZone(),
      })
    : "";
  const to = endAt
    ? endAt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: getBrowserTimeZone(),
      })
    : "";

  return (
    <div className="flex justify-center gap-6 p-6 sm:p-10 flex-col sm:flex-row bg-tinted-gray">
      <div>
        <h1 className="text-primary font-bold mb-1 text-3xl">CHỈNH SỬA</h1>
        <p className="text-txt-gray text-sm">
          Bạn có thể thay đổi thông tin liên lạc hoặc hủy lịch hẹn tại đây.
        </p>
        {errorMessage ? (
          <p className="text-red-500 text-sm my-6">{errorMessage}</p>
        ) : booking ? (
          <div className="bg-tinted-blue rounded-lg shadow-lg p-4 my-6 flex items-center gap-4">
            <div className="sm:block"><CalendarSVG></CalendarSVG></div>
            <div>
              <h1 className="text-primary font-bold mb-1 text-lg">THÔNG TIN LỊCH HẸN</h1>
              <p className="font-bold text-md">
                {startAt?.toLocaleString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: getBrowserTimeZone(),
                })}
                <br></br>
                {from} - {to}
              </p>
              <p className="text-txt-gray text-sm">Mã đặt chỗ: {booking.reservationCode}</p>
              <p className="text-txt-gray">Tư vấn online</p>
            </div>
          </div>
        ) : null}
        {booking ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-bold">THÔNG TIN LIÊN LẠC</h3>
            </div>
            <BookingChangeForm
              initialValues={{
                name: booking.patientName ?? "",
                email: booking.patientEmail ?? "",
                phone: booking.patientPhone ?? "",
                birthdate: booking.patientBirthdate ?? "",
                gender: booking.patientGender ?? "",
              }}
              onSubmit={handleUpdate}
              onCancelBooking={handleDelete}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function BookingChangePage() {
  return (
    <Suspense fallback={<div className="bg-tinted-gray p-6 sm:p-10" />}>
      <BookingChangeContent />
    </Suspense>
  );
}
