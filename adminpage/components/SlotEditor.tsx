
import { Edit } from "lucide-react"
import { Slot } from "./Slot"
import EditCloseIcon from "./icons/EditCloseIcon"
import CalendarSVG from "./icons/CalendarSVG"

import { CreditCard } from "lucide-react";
import { User } from "lucide-react";

export default function SlotEditor(
    {
        slot, setSelectedSlot, setTempSlot
    }:
        {
            slot: Slot,
            setSelectedSlot: (slot:Slot | undefined) => void,
            setTempSlot: (slot:Slot | undefined) => void
        }


) {
    const onEditClose = async (action: "save" | "discard" | "update" | "delete", slot:Slot) => {
        if (action === "discard") {
            setSelectedSlot(undefined);
            setTempSlot(undefined);
        }

        else if (action == "update"){
            // update the slot on the frontend only without saving to the database
        }

        else if (action === "save") {
            // Make the change on the database
        }

        else if (action === "delete"){
            if (slot.status === "creating"){
                setSelectedSlot(undefined);
                setTempSlot(undefined);
            }
        }
    }; 

    return (
        <div className="h-[100vh] bg-white absolute top-0 right-0 p-2 z-10 min-w-[50vw] border-l border-gray-300 shadow-2xl">
            <button
                className="hover:bg-light-gray p-2 rounded"
                onClick={() => { onEditClose("discard", slot) }}
            >
                <EditCloseIcon></EditCloseIcon>
            </button>
            <div className="px-8 py-4">
                <div className="flex">
                    <div className="mb-6 flex items-center gap-4">
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
                    <div className="flex text-white my-auto ml-auto gap-2">
                        <button className="p-3 bg-[#c20404] hover:bg-[#d90404] rounded-xl" onClick={() => { onEditClose("delete", slot) }}>✕ Xóa</button>
                        <button className="p-3 bg-primary-dark hover:bg-primary rounded-xl ml-auto" onClick={() => { onEditClose("save", slot) }}>✓ Lưu</button>
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
                        : ""} {slot.title}
                    </h3>
                    {/*TODO: link to patient page */}

                </div>
            </div>
        </div>
    )
}