"use client"
import ContactForm from "@/components/ContactForm";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"
import CalendarSVG from "@/components/CalendarSVG";

type BookingDetails = {
    id: string;
    reservationCode: number;
    status: string;
    slotId: string;
    expiresAt: string;
    displayExpiresAt: string;
    startAt: string;
    endAt: string;
    patientName?: string | null;
    patientEmail?: string | null;
    patientPhone?: string | null;
    patientBirthdate?: string | null;
    patientGender?: string | null;
}

function getBrowserTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function BookingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("bookingId");
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const [hasHandledExpiry, setHasHandledExpiry] = useState(false);

    useEffect(() => {
        if (!bookingId) {
            setErrorMessage("Thiếu mã booking.");
            return;
        }

        const loadBooking = async () => {
            try {
                const res = await fetch(`/api/booking/${bookingId}`, {
                    credentials: "include",
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data?.error ?? "Không tải được booking.");
                }

                setBooking(data.booking);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Không tải được booking.");
            }
        };

        loadBooking();
    }, [bookingId])

    useEffect(() => {
        if (!booking?.displayExpiresAt) {
            setSecondsLeft(null);
            return;
        }

        const updateCountdown = () => {
            const remaining = Math.max(
                0,
                Math.floor((new Date(booking.displayExpiresAt).getTime() - Date.now()) / 1000)
            );
            setSecondsLeft(remaining);
        };

        updateCountdown();
        const intervalId = window.setInterval(updateCountdown, 1000);
        return () => window.clearInterval(intervalId);
    }, [booking?.displayExpiresAt])

    useEffect(() => {
        if (secondsLeft !== 0 || hasHandledExpiry) {
            return;
        }

        setHasHandledExpiry(true);
        alert("Booking has expired");
        router.push("/");
    }, [hasHandledExpiry, router, secondsLeft])

    const startAt = booking?.startAt ? new Date(booking.startAt) : null;
    const endAt = booking?.endAt ? new Date(booking.endAt) : null;
    const from = startAt ? startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: getBrowserTimeZone() }) : "";
    const to = endAt ? endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: getBrowserTimeZone() }) : "";
    const minutes = secondsLeft !== null ? String(Math.floor(secondsLeft / 60)).padStart(2, "0") : "00";
    const seconds = secondsLeft !== null ? String(secondsLeft % 60).padStart(2, "0") : "00";

    return (
        <div className="flex justify-center gap-6 p-6 sm:p-10 flex-col sm:flex-row bg-tinted-gray">
            <div>
                <h1 className="text-primary font-bold mb-1 text-3xl">ĐẶT CHỖ CỦA BẠN</h1>
                <p className="text-txt-gray text-sm">Vui lòng điền thông tin liên hệ và chúng tôi sẽ xác nhận lịch hẹn của bạn.</p>
                <p className="text-txt-gray text-sm">Thời gian giữ chỗ còn lại: <span className="text-red-600">{minutes}:{seconds}</span></p>
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
                                })}   <br></br>   {from} - {to}
                            </p>
                            <p className="text-txt-gray text-sm">Mã đặt chỗ: {booking.reservationCode}</p>
                            
                            <p className="text-txt-gray">Tư vấn online</p>
                        </div>
                    </div>
                ) : null}
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-bold">THÔNG TIN LIÊN HỆ</h3>
                </div>
                <ContactForm
                    initialValues={{
                        name: booking?.patientName ?? "",
                        email: booking?.patientEmail ?? "",
                        phone: booking?.patientPhone ?? "",
                        birthdate: booking?.patientBirthdate ?? "",
                        gender: booking?.patientGender ?? "",
                    }}
                ></ContactForm>
            </div>
        </div>
    )
}

export default function Booking() {
    return (
        <Suspense fallback={<div className="bg-tinted-gray p-6 sm:p-10" />}>
            <BookingContent />
        </Suspense>
    );
}
