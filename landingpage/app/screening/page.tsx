"use client"
import Chat from "@/components/ChatUI";
import ContactForm from "@/components/ContactForm";
import { Chathura } from "next/font/google";
import { useSearchParams } from "next/navigation"
import CalendarSVG from "@/components/CalendarSVG";

export default function Screening() {

    // TODO: Change pending in database first then load it using ID, not via URL param passing
    const searchParams = useSearchParams();

    const date = new Date(searchParams.get("date"));
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    console.log(date, from, to);

    return (
        <div className="flex justify-center gap-6 p-10 flex-col sm:flex-row sm:bg-tinted-gray items-stretch sm:h-[760px] h-full">
            <div className="sm:bg-white sm:p-10 sm:shadow-xl rounded-lg">
                <h1 className="text-primary font-bold mb-1 text-3xl">ĐẶT CHỖ CỦA BẠN</h1>
                <p className="text-txt-gray text-sm">
                    Lịch hẹn của bạn đã được xác nhận. <br></br>
                    Bạn có thể  chỉnh sửa thông tin liên lạc nếu cần thiết.
                </p>
                {
                    <div className="bg-tinted-blue rounded-lg shadow-lg p-4 my-6 flex items-center gap-4">
                        <CalendarSVG></CalendarSVG>
                        <div>
                            <h1 className="text-primary font-bold mb-1 text-lg">THÔNG TIN LỊCH HẸN</h1>
                            <p className="font-bold text-md">
                                {date.toLocaleString("vi-VN", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}   <br></br>   {from} - {to}
                            </p>
                            <p className="text-txt-gray">Tư vấn online</p>
                        </div>

                    </div>
                }
                <h3 className="font-bold mb-4">THÔNG TIN LIÊN HỆ</h3>
                <ContactForm confirmed={true}></ContactForm>
            </div>
            <Chat></Chat>
        </div>
    )
}