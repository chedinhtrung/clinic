"use client"
import { useState } from "react"
import { DayPicker } from "react-day-picker"
import { vi } from "date-fns/locale"
import { useEffect } from "react"

export default function Booking() {
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState();
    const [slotlist, setSlotlist] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState();

    async function onDateSelect(date) {
        setSlotlist([]);
        if (date === undefined) {
            return; 
        }
        setSelectedSlot(null);
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
        setSlotlist(data)
    }

    function onSlotSelect(slot) {
        console.log(selectedSlot === slot);
        console.log(selectedSlot);
        if (slot === selectedSlot) {
            setSelectedSlot(null);
        }
        else {
            setSelectedSlot(slot);
        }

    }

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
        <div className="bg-bg-tinted flex justify-center">
            <div className="flex flex-col sm:flex-row mb-10 sm:px-20 px-6 py-10 sm:min-w-[1500px] gap-5 sm:gap-20">
                <h3 className="text-primary font-bold">LỊCH KHÁM & BẢNG GIÁ</h3>
                <div>
                    
                </div>

                <div className="ml-auto">
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
                    />
                </div>

                <div>
                    <div className="h-[2.75rem] flex items-center">
                        <h3 className="text-primary font-bold ">Khung giờ</h3>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[150px] sm:max-h-[250px] min-w-[130px]">
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
                            <a href={`/booking?date=${selectedDate.toISOString()}&from=${selectedSlot.from}&to=${selectedSlot.to}`} className="p-2 block mt-4 bg-primary text-white rounded-lg font-bold text-center">ĐẶT LỊCH</a>
                        ) : (
                            <div className="p-4"></div>
                        )
                    }
                    
                </div>
            </div>
        </div>
    )
}