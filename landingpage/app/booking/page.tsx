"use client"
import ContactForm from "@/components/ContactForm";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"
import CalendarSVG from "@/components/CalendarSVG";

type BookingDetails = {
    id: string;
    reservationCode: number;
    status: string;
    slotId: string;
    startAt: string;
    endAt: string;
}

export default function Booking() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("bookingId");
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!bookingId) {
            setErrorMessage("Thiếu mã booking.");
            return;
        }

        const loadBooking = async () => {
            try {
                const res = await fetch(`http://localhost:5001/api/booking/${bookingId}`, {
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

    const startAt = booking?.startAt ? new Date(booking.startAt) : null;
    const endAt = booking?.endAt ? new Date(booking.endAt) : null;
    const from = startAt ? startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
    const to = endAt ? endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";

    return (
        <div className="flex justify-center gap-6 p-6 sm:p-10 flex-col sm:flex-row bg-tinted-gray">
            <div>
                <h1 className="text-primary font-bold mb-1 text-3xl">ĐẶT CHỖ CỦA BẠN</h1>
                <p className="text-txt-gray text-sm">Vui lòng điền thông tin liên hệ và chúng tôi sẽ xác nhận lịch hẹn của bạn</p>
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
                                })}   <br></br>   {from} - {to}
                            </p>
                            <p className="text-txt-gray text-sm">Mã đặt chỗ: {booking.reservationCode}</p>
                            <p className="text-txt-gray">Tư vấn online</p>
                        </div>
                    </div>
                ) : null}
                <h3 className="font-bold mb-4">THÔNG TIN LIÊN HỆ</h3>
                <ContactForm></ContactForm>
            </div>
        </div>
    )
}
