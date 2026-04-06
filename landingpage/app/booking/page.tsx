"use client"
import Chat from "@/components/ChatUI";
import ContactForm from "@/components/ContactForm";
import { useSearchParams } from "next/navigation"
import CalendarSVG from "@/components/CalendarSVG";

export default function Booking() {
    const searchParams = useSearchParams();

    const bookingId = searchParams.get("bookingId");
    const reservationCode = searchParams.get("reservationCode");
    const startAtParam = searchParams.get("startAt");
    const endAtParam = searchParams.get("endAt");

    const startAt = startAtParam ? new Date(startAtParam) : null;
    const endAt = endAtParam ? new Date(endAtParam) : null;
    const from = startAt ? startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
    const to = endAt ? endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";

    return (
        <div className="flex justify-center gap-6 p-6 sm:p-10 flex-col sm:flex-row bg-tinted-gray">
            <div>
                <h1 className="text-primary font-bold mb-1 text-3xl">ĐẶT CHỖ CỦA BẠN</h1>
                <p className="text-txt-gray text-sm">Vui lòng điền thông tin liên hệ và chúng tôi sẽ xác nhận lịch hẹn của bạn</p>
                {
                    <div className="bg-tinted-blue rounded-lg shadow-lg p-4 my-6 flex items-center gap-4">
                        <div className=" sm:block"><CalendarSVG></CalendarSVG></div>
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
                            <p className="text-txt-gray text-sm">Mã đặt chỗ: {reservationCode}</p>
                            <p className="text-txt-gray">Tư vấn online</p>
                        </div>

                    </div>
                }
                <h3 className="font-bold mb-4">THÔNG TIN LIÊN HỆ</h3>
                <ContactForm></ContactForm>
            </div>
        </div>
    )
}
