"use client"
import { useState } from "react"
import { DayPicker } from "react-day-picker"
import { vi } from "date-fns/locale"
import { useEffect } from "react"

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

import { useRef } from "react";
import interactionPlugin from "@fullcalendar/interaction";
import { Slot } from "./Slot"

import SlotEdit from "./SlotEdit"

export default function SlotManagement() {

    const POPUP_WIDTH = 400;
    const POPUP_HEIGHT = 300;
    const OFFSET = 10;

    const [slotlist, setSlotlist] = useState<Slot[]>([]); // for slots coming from database 
    const [selectedSlot, setSelectedSlot] = useState<Slot | undefined>(); // For editing existing slots
    const [popupPos, setPopupPos] = useState<{ x: number, y: number } | undefined>(); // For editing existing slots
    const [tempSlot, setTempSlot] = useState<Slot | undefined>(undefined); // For adding a new slot 

    useEffect(() => {

        if (!selectedSlot) return;

        const updatePosition = () => {

            const el = document.querySelector(
                `[data-slot-id="${selectedSlot.id}"]`
            );

            if (!el) return;

            const rect = el.getBoundingClientRect();

            let x = rect.right + OFFSET;
            let y = rect.top;

            // Flip horizontally if overflowing right
            if (x + POPUP_WIDTH > window.innerWidth) {
                x = rect.left - POPUP_WIDTH - OFFSET;
            }

            // Clamp vertically
            if (y + POPUP_HEIGHT > window.innerHeight) {
                y = window.innerHeight - POPUP_HEIGHT - OFFSET;
            }

            if (y < OFFSET) {
                y = OFFSET;
            }

            setPopupPos({ x, y });
        };

        updatePosition();

        window.addEventListener("scroll", updatePosition);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [selectedSlot]);

    const calendarRef = useRef<FullCalendar | null>(null);

    const getSlotsFromRange = async (info: any) => {
        console.log("Refreshed");

        if (info.view.type === "dayGridMonth") {
            setTempSlot(undefined); // Clears temp slot if we go back to month view
        }

        const res = await fetch("http://localhost:5002/api/get_slots", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ start: info.startStr, end: info.endStr }),
        });

        const data = await res.json();
        const parsed = data.map((slot: any) => ({
            ...slot,
            start: new Date(slot.start),
            end: new Date(slot.end)
        }));
        setSlotlist(parsed);
    }

    const onSlotClick = (info: any) => {

        const slotId = info.event.extendedProps.id;

        const slot =
            slotlist.find(s => s.id === slotId) ||
            (tempSlot && tempSlot.id === slotId ? tempSlot : undefined);

        setSelectedSlot(slot);
        
        if (slot !== tempSlot){
            setTempSlot(undefined);
        }
       
    }

    const onEditClose = async (action: "save" | "discard") => {
        if (action === "discard"){
            setSelectedSlot(undefined);
            setTempSlot(undefined);
        }
        else if (action === "save"){
            // TODO: query database
        }
    }   

    const onNewSlot = (info: any) => {
        if (info.allDay) {
            return; // fix the whole day event bug
        }
        console.log("New Slot Clicked", info);
        const newSlot: Slot = {
            id: "",
            start: info.start,
            end: info.end,
            status: "creating",
            title: "Lịch hẹn trống"
        }

        setSelectedSlot(newSlot);
        setTempSlot(newSlot);
    }

    return (
        <div className="">
            <div className="bg-bg-tinted p-4">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    dayMaxEvents={3}
                    height="auto"
                    selectable={true}
                    selectMirror={true}
                    select={onNewSlot}
                    headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek",
                    }}
                    dateClick={(info) => {
                        const api = calendarRef.current?.getApi();
                        api?.changeView("timeGridWeek", info.date);
                    }}
                    eventClick={(info) => {
                        const api = calendarRef.current?.getApi();
                        if (info.event.start && api?.view.type !== "timeGridWeek") {
                            api?.changeView("timeGridWeek", info.event.start);
                            return;
                        }
                        onSlotClick(info);
                    }}
                    datesSet={(info) => {
                        getSlotsFromRange(info);
                    }}
                    events={[...slotlist, ...(tempSlot ? [tempSlot] : [])].map((slot, i) => ({
                        start: slot.start,
                        end: slot.end,
                        title: slot.title,
                        color: slot.status === "free" ? "#0d6e56"
                            : slot.status === "pending" ? "#f59e0b"
                            : slot.status === "creating" ? "#4d756bff"
                            : "#ef4444",
                        extendedProps: {
                            id: slot.id,
                            status: slot.status
                        }
                    }))}
                    eventDidMount={(info) => {
                        info.el.setAttribute("data-slot-id", info.event.extendedProps.id);
                    }}

                />
            </div>
            {selectedSlot && popupPos && (
                <SlotEdit
                    slot={selectedSlot}
                    closeHandler={onEditClose}
                    position={popupPos}
                    height={POPUP_HEIGHT}
                    width={POPUP_WIDTH}
                ></SlotEdit>
            )}
        </div>
    )
}