"use client"
import { useState } from "react"
import { DayPicker } from "react-day-picker"
import { vi } from "date-fns/locale"
import { useEffect } from "react"

type Slot = {
    date: Date;
    from: string;
    to: string;
}

export default function Booking() {
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [slotlist, setSlotlist] = useState<Slot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Slot | undefined>();

    async function onDateSelect(date: Date | undefined) {
        setSlotlist([]);
        if (date === undefined) {
            return;
        }
        setSelectedSlot(undefined);
        setSelectedDate(date);
        console.log(date);

        // get the slots at the selected date
        const res = await fetch("http://localhost:5001/api/get_available_slots", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(date),
        })
        const data = await res.json()

        console.log(data);
        setSlotlist(data);
    }

    function onSlotSelect(slot: Slot) {
        console.log(selectedSlot === slot);
        console.log(selectedSlot);
        if (slot === selectedSlot) {
            setSelectedSlot(undefined);
        }
        else {
            setSelectedSlot(slot);
        }

    }

    // get the available dates from the database
    useEffect(() => {
        const fetchDates = async () => {
            const res = await fetch("http://localhost:5001/api/get_available_dates")
            const data = await res.json();

            console.log(data);
            const parsed = data.map((d: string) => new Date(d));
            setAvailableDates(parsed);
        }

        fetchDates();
    }, [])

    return (
        <div className="bg-bg-tinted px-6 sm:px-20 py-10 flex flex-col justify-center">
            <h3 className="text-primary font-bold mb-4">LỊCH KHÁM & BẢNG GIÁ</h3>
            <div className="flex flex-col sm:flex-row mb-10 gap-5 sm:gap-20">

                <div className="shadow-lg rounded-[20px] border-2 border-primary p-8 bg-white">
                    <h4 className="text-txt-gray font-bold">Tư vấn chuyên sâu</h4>
                    <h4 className="text-txt-gray font-bold"><span className="text-[3.0rem] text-black font-normal">50k </span> /lượt</h4>
                    <p className="text-txt-gray">Đọc phim, phân tích lâm sàng, tư vấn phẫu thuật <br></br><br></br></p>
                    <p className="text-txt-dark leading-loose ">
                        <span className="text-primary">✓</span> Video call 30 phút <br></br>
                        <span className="text-primary">✓</span> Phân tích X-quang / MRI / CT <br></br>
                        <span className="text-primary">✓</span> Kê đơn thuốc (nếu phù hợp)
                    </p>
                </div>
                <div className="flex gap-6 sm:ml-auto flex-col sm:flex-row">
                    <div className="flex justify-center">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={onDateSelect}
                            locale={vi}
                            modifiers={{
                                available: availableDates
                            }}
                            modifiersClassNames={{
                                available: "bg-green-100 text-green-800 rounded-full"
                            }}
                            required={false}
                        />
                    </div>

                    <div className="sm:ml-auto">
                        <div className="h-[2.75rem] flex items-center">
                            <h3 className="text-primary font-bold ">Khung giờ</h3>
                        </div>
                        <div className="flex flex-col gap-2 overflow-y-auto max-h-[250px] min-w-[130px] pr-4">
                            {slotlist.map((s, i) => (
                                <div
                                    key={i}
                                    className={`px-4 py-2 rounded-lg ${s === selectedSlot ? `bg-primary text-white` : `bg-primary-light`} hover:bg-primary hover:text-white text-center`}
                                    onClick={() => { onSlotSelect(s) }}
                                >
                                    {s.from} - {s.to}
                                </div>
                            ))}
                        </div>
                        {
                            selectedSlot ? (
                                <a href="#" className="p-2 block mt-4 bg-primary text-white rounded-lg font-bold text-center">ĐẶT LỊCH</a>
                            ) : (
                                <div className="p-4"></div>
                            )
                        }

                    </div>
                </div>
            </div>
        </div>
    )
}