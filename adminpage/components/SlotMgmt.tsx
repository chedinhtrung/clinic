"use client"
import { useCallback, useRef, useState } from "react"

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { DatesSetArg, DateSelectArg, EventClickArg } from "@fullcalendar/core";

import interactionPlugin from "@fullcalendar/interaction";
import { Slot } from "./Slot"

import viLocale from '@fullcalendar/core/locales/vi'

import SlotEditor from "./SlotEditor";
import { fetchSlot, fetchSlotsByRange } from "./slotApi";

export default function SlotManagement() {

    const [slotlist, setSlotlist] = useState<Slot[]>([]); // for slots coming from database 
    const [selectedSlot, setSelectedSlot] = useState<Slot | undefined>(); // For editing existing slots
    const [tempSlot, setTempSlot] = useState<Slot | undefined>(undefined); // For adding a new slot 
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const calendarRef = useRef<FullCalendar | null>(null);
    const visibleRangeRef = useRef<{ start: string, end: string } | undefined>(undefined);

    const getSlotsFromRange = useCallback(async (info: DatesSetArg) => {
        visibleRangeRef.current = { start: info.startStr, end: info.endStr };
        if (info.view.type === "dayGridMonth") {
            setTempSlot(undefined); // Clears temp slot if we go back to month view
        }

        setIsLoadingSlots(true);
        setErrorMessage(undefined);
        try {
            const slots = await fetchSlotsByRange(info.startStr, info.endStr);
            setSlotlist(slots);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Không thể tải lịch hẹn.");
        } finally {
            setIsLoadingSlots(false);
        }
    }, []);

    const refreshVisibleSlots = useCallback(async () => {
        const visibleRange = visibleRangeRef.current;
        if (!visibleRange) {
            return;
        }

        setIsLoadingSlots(true);
        setErrorMessage(undefined);
        try {
            const slots = await fetchSlotsByRange(visibleRange.start, visibleRange.end);
            setSlotlist(slots);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Không thể tải lại lịch hẹn.");
        } finally {
            setIsLoadingSlots(false);
        }
    }, []);

    const onSlotClick = async (info: EventClickArg) => {

        const slotId = info.event.extendedProps.id;

        if (!slotId && tempSlot) {
            setSelectedSlot(tempSlot);
            return;
        }

        setErrorMessage(undefined);
        try {
            const slot = await fetchSlot(slotId);
            setSelectedSlot(slot);
            setTempSlot(undefined);
        } catch (error) {
            const fallbackSlot = slotlist.find(s => s.id === slotId);
            setSelectedSlot(fallbackSlot);
            setErrorMessage(error instanceof Error ? error.message : "Không thể tải thông tin lịch hẹn.");
        }

    };

    const onNewSlot = (info: DateSelectArg) => {
        if (info.allDay) {
            return; // fix the whole day event bug
        }
        const newSlot: Slot = {
            id: "",
            start: info.start,
            end: info.end,
            status: "creating",
            title: "Lịch hẹn trống"
        }

        setSelectedSlot(newSlot);
        setTempSlot(newSlot);
        setErrorMessage(undefined);
    };

    const handleSlotSaved = async (slot: Slot) => {
        setSelectedSlot(slot);
        setTempSlot(undefined);
        await refreshVisibleSlots();
    };

    const handleSlotDeleted = async () => {
        setSelectedSlot(undefined);
        setTempSlot(undefined);
        await refreshVisibleSlots();
    };

    return (
        <div className="h-[100%] flex-1 relative">
            <div className="bg-bg-tinted p-4 h-[100vh]">
                {(isLoadingSlots || errorMessage) && (
                    <div className="absolute left-8 top-6 z-10 max-w-md rounded border border-gray-200 bg-white px-4 py-3 text-sm shadow">
                        {isLoadingSlots && <p className="text-txt-gray">Đang tải lịch hẹn...</p>}
                        {errorMessage && <p className="text-[#c20404]">{errorMessage}</p>}
                    </div>
                )}
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
                    events={[...slotlist, ...(tempSlot ? [tempSlot] : [])].map((slot) => ({
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
                setSelectedSlot={setSelectedSlot}
                setTempSlot={setTempSlot}
                onSlotSaved={handleSlotSaved}
                onSlotDeleted={handleSlotDeleted}
                ></SlotEditor>
            )}
        </div>
    )
}
