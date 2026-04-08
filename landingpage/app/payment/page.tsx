"use client"

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function PaymentPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("bookingId");
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const [hasHandledExpiry, setHasHandledExpiry] = useState(false);
    const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);

    useEffect(() => {
        if (!bookingId) {
            setErrorMessage("Thieu ma booking.");
            return;
        }

        const loadBooking = async () => {
            try {
                const res = await fetch(`http://localhost:5001/api/booking/${bookingId}`, {
                    credentials: "include",
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data?.error ?? "Khong tai duoc booking.");
                }

                setBooking(data.booking);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Khong tai duoc booking.");
            }
        };

        loadBooking();
    }, [bookingId]);

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
    }, [booking?.displayExpiresAt]);

    useEffect(() => {
        if (secondsLeft !== 0 || hasHandledExpiry) {
            return;
        }

        setHasHandledExpiry(true);
        alert("Booking has expired");
        router.push("/");
    }, [hasHandledExpiry, router, secondsLeft]);

    async function onStartVNPayPayment() {
        if (!booking) {
            return;
        }

        setIsRedirectingToPayment(true);
        try {
            const res = await fetch("http://localhost:5001/api/payment/vnpay", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bookingId: booking.id,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error ?? "Không tạo được thanh toán, vui lòng thử lại sau.");
            }

            window.location.href = data.paymentUrl;
        } catch (error) {
            alert(error instanceof Error ? error.message : "Không tạo được thanh toán, vui lòng thử lại sau.");
        } finally {
            setIsRedirectingToPayment(false);
        }
    }

    const startAt = booking?.startAt ? new Date(booking.startAt) : null;
    const endAt = booking?.endAt ? new Date(booking.endAt) : null;
    const from = startAt ? startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: getBrowserTimeZone() }) : "";
    const to = endAt ? endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: getBrowserTimeZone() }) : "";
    const minutes = secondsLeft !== null ? String(Math.floor(secondsLeft / 60)).padStart(2, "0") : "00";
    const seconds = secondsLeft !== null ? String(secondsLeft % 60).padStart(2, "0") : "00";

    return (
        <div className="flex justify-center p-6 sm:p-10 bg-tinted-gray">
            <div className="w-full max-w-2xl">
                <h1 className="text-primary font-bold mb-2 text-3xl">THANH TOÁN</h1>
                <p className="text-txt-gray text-sm">Vui lòng kiểm tra lại thông tin đặt chỗ trước khi thanh toán.</p>
                <p className="text-txt-gray text-sm">Thời gian giữ chỗ còn lại: <span className="text-red-600">{minutes}:{seconds}</span></p>
                {errorMessage ? (
                    <p className="text-red-500 text-sm">{errorMessage}</p>
                ) : booking ? (
                    <div className="space-y-6">
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

                        <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
                            <h2 className="font-bold text-lg">THÔNG TIN LIÊN HỆ</h2>
                            <p className="text-txt-gray"><span className="font-semibold text-black">Họ và tên:</span> {booking.patientName}</p>
                            <p className="text-txt-gray"><span className="font-semibold text-black">Email:</span> {booking.patientEmail}</p>
                            <p className="text-txt-gray"><span className="font-semibold text-black">Số điện thoại:</span> {booking.patientPhone || "-"}</p>
                            <p className="text-txt-gray"><span className="font-semibold text-black">Ngày sinh:</span> {booking.patientBirthdate || "-"}</p>
                            <p className="text-txt-gray"><span className="font-semibold text-black">Giới tính:</span> {booking.patientGender === "male" ? "Nam" : "Nữ"}</p>
                        </div>

                        <button
                            type="button"
                            className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-white disabled:opacity-60"
                            onClick={onStartVNPayPayment}
                            disabled={isRedirectingToPayment}
                        >
                            {isRedirectingToPayment ? "Đang chuyển hướng..." : "Thanh toán qua VNPay"}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="bg-tinted-gray p-6 sm:p-10" />}>
            <PaymentPageContent />
        </Suspense>
    );
}
