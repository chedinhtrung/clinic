import { Slot } from "./Slot"
import CalendarSVG from "./CalendarSVG";
import { CreditCard } from "lucide-react";
import { User } from "lucide-react";
<CreditCard className="text-white w-5 h-5" />

export default function SlotEdit(
    {
        slot,
        closeHandler,
        position: { x, y },
        width,
        height

    }:
        {
            slot: Slot;
            closeHandler: (action: "save" | "discard") => void,
            position: { x: number, y: number },
            width: number,
            height: number
        }
) {
    return (
        <div className="fixed z-10 bg-tinted-blue p-4 rounded-xl flex flex-col" style={{ top: y, left: x, width: width, height: height }}>
            <div className="my-6 flex items-center gap-4">
                <CalendarSVG></CalendarSVG>
                <div>
                    <div className="flex gap-2">
                        <h1 className="text-primary font-bold mb-1 text-lg">
                            {
                                slot.status === "creating" ? "TẠO LỊCH HẸN MỚI" : "THÔNG TIN LỊCH HẸN"
                            }
                        </h1>
                    </div>

                    <p className="font-bold text-md">{slot.start.toLocaleString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}   <br></br>   {slot.start.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        &nbsp;&nbsp; - &nbsp;&nbsp;
                        {slot.end.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    <p className="text-txt-gray">Tư vấn online</p>
                </div>

            </div>

            <div className={`p-1 rounded-xl max-w-40 mb-2 text-center text-white ${slot.status === "free" ? "bg-[#0d6e56]"
                : slot.status === "pending" ? "bg-[#f59e0b]"
                    : slot.status === "creating" ? "bg-[#4d756bff]"
                        : "bg-[#ef4444]"
                }`}>
                <h3 className="flex gap-2">{(slot.status === "free" || slot.status === "creating") ? "✓" 
                                            : slot.status === "pending" ? <CreditCard></CreditCard>
                                            : slot.status === "confirmed" ? <User></User> 
                                            : ""} {slot.title}</h3> 
                {/*TODO: link to patient page */}

            </div>
            <div className="flex-1">
            </div>
            <div className="flex text-white mt-auto">
                <button className="p-3 bg-[#c20404] hover:bg-[#d90404] rounded-xl" onClick={() => { closeHandler("discard") }}>✕ Hủy thay đổi</button>
                <button className="p-3 bg-primary-dark hover:bg-primary rounded-xl ml-auto" onClick={() => { closeHandler("save") }}>✓ Xác nhận</button>
            </div>

        </div>
    )
}