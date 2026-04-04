"use client"
import { useState } from "react"
import { useEffect } from "react"

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

import { useRef } from "react";
import interactionPlugin from "@fullcalendar/interaction";
import { Slot } from "./Slot"

import viLocale from '@fullcalendar/core/locales/vi'

import SlotEditor from "./SlotEditor";

export default function SlotManagement() {

    const [slotlist, setSlotlist] = useState<Slot[]>([]); // for slots coming from database 
    const [selectedSlot, setSelectedSlot] = useState<Slot | undefined>(); // For editing existing slots
    const [popupPos, setPopupPos] = useState<{ x: number, y: number } | undefined>(); // For editing existing slots
    const [tempSlot, setTempSlot] = useState<Slot | undefined>(undefined); // For adding a new slot 

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

        if (slot !== tempSlot) {
            setTempSlot(undefined);
        }

    }

    const onEditClose = async (action: "save" | "discard" | "update", slot:Slot) => {
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
        <div className="h-[100%] flex-1">
            <div className="bg-bg-tinted p-4 h-[100vh]">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    dayMaxEvents={3}
                    allDaySlot={false}
                    locale={viLocale}
                    height="100%"
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
            {selectedSlot && (
                <SlotEditor
                slot={selectedSlot}
                closeHandler={onEditClose}
                ></SlotEditor>
            )}
        </div>
    )
}