"use client"

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type BookingDetails = {
    id: string;
    reservationCode: number;
    status: string;
    slotId: string;
    expiresAt: string;
    displayExpiresAt: string;
    startAt: string;
    endAt: string;
}

function getBrowserTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export default function PaymentPage() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("bookingId");
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const startAt = booking?.startAt ? new Date(booking.startAt) : null;
    const endAt = booking?.endAt ? new Date(booking.endAt) : null;
    const from = startAt ? startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: getBrowserTimeZone() }) : "";
    const to = endAt ? endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: getBrowserTimeZone() }) : "";

    return (
        <div className="flex justify-center p-6 sm:p-10 bg-tinted-gray">
            <div className="w-full max-w-2xl">
                <h1 className="text-primary font-bold mb-2 text-3xl">THANH TOAN</h1>
                {errorMessage ? (
                    <p className="text-red-500 text-sm">{errorMessage}</p>
                ) : booking ? (
                    <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
                        <p className="text-txt-gray text-sm">Ma dat cho: {booking.reservationCode}</p>
                        <p className="font-bold text-md">
                            {startAt?.toLocaleString("vi-VN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                timeZone: getBrowserTimeZone(),
                            })}
                        </p>
                        <p className="text-txt-gray">{from} - {to}</p>
                        <p className="text-txt-gray">Trang thanh toan se duoc tiep tuc o buoc tiep theo.</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
