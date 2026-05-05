"use client";

import { useMemo, useState } from "react";
import { Clock3, Save } from "lucide-react";
import EditCloseIcon from "./icons/EditCloseIcon";
import CalendarSVG from "./icons/CalendarSVG";
import { createSlot } from "./slotApi";
import { Slot } from "./Slot";

function padDatePart(value: number): string {
    return String(value).padStart(2, "0");
}

function toDisplayDateTimeValue(date: Date): string {
    const hours24 = date.getHours();
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;

    return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}, ${padDatePart(hours12)}:${padDatePart(date.getMinutes())} ${period}`;
}

function parseDisplayDateTimeValue(value: string): Date | undefined {
    const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
        return undefined;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const rawHours = Number(match[4]);
    const minutes = Number(match[5]);
    const period = match[6].toUpperCase();

    if (rawHours < 1 || rawHours > 12 || minutes < 0 || minutes > 59) {
        return undefined;
    }

    let hours = rawHours % 12;
    if (period === "PM") {
        hours += 12;
    }

    const parsed = new Date(year, month - 1, day, hours, minutes);
    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day ||
        parsed.getHours() !== hours ||
        parsed.getMinutes() !== minutes
    ) {
        return undefined;
    }

    return parsed;
}

export default function AddSlotsEditor({
    onClose,
    onSlotsCreated,
}: {
    onClose: () => void;
    onSlotsCreated: (slots: Slot[]) => Promise<void>;
}) {
    const [startValue, setStartValue] = useState(toDisplayDateTimeValue(new Date()));
    const [durationMinutes, setDurationMinutes] = useState("15");
    const [slotCount, setSlotCount] = useState("1");
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [isSaving, setIsSaving] = useState(false);

    const previewText = useMemo(() => {
        const start = parseDisplayDateTimeValue(startValue);
        const duration = Number(durationMinutes);
        const count = Number(slotCount);
        if (!start || !Number.isInteger(duration) || !Number.isInteger(count) || duration <= 0 || count <= 0) {
            return "";
        }

        const end = new Date(start.getTime() + duration * count * 60000);
        return `${count} slot, mỗi slot ${duration} phút, từ ${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} đến ${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    }, [durationMinutes, slotCount, startValue]);

    const previewSlots = useMemo(() => {
        const start = parseDisplayDateTimeValue(startValue);
        const duration = Number(durationMinutes);
        const count = Number(slotCount);
        if (!start || !Number.isInteger(duration) || !Number.isInteger(count) || duration <= 0 || count <= 0) {
            return [];
        }

        const slots: Array<{ start: Date; end: Date }> = [];
        for (let index = 0; index < count; index += 1) {
            const slotStart = new Date(start.getTime() + index * duration * 60000);
            const slotEnd = new Date(slotStart.getTime() + duration * 60000);
            slots.push({ start: slotStart, end: slotEnd });
        }

        return slots;
    }, [durationMinutes, slotCount, startValue]);

    const handleSave = async () => {
        const parsedStart = parseDisplayDateTimeValue(startValue);
        const duration = Number(durationMinutes);
        const count = Number(slotCount);

        if (!parsedStart) {
            setErrorMessage("Thời gian bắt đầu phải theo định dạng dd/mm/yyyy, hh:mm AM/PM.");
            return;
        }

        if (!Number.isInteger(duration) || duration <= 0) {
            setErrorMessage("Thời lượng slot phải là số nguyên dương (phút).");
            return;
        }

        if (!Number.isInteger(count) || count <= 0) {
            setErrorMessage("Số lượng slot phải là số nguyên dương.");
            return;
        }

        setIsSaving(true);
        setErrorMessage(undefined);

        try {
            const createdSlots: Slot[] = [];
            for (let index = 0; index < count; index += 1) {
                const start = new Date(parsedStart.getTime() + index * duration * 60000);
                const end = new Date(start.getTime() + duration * 60000);
                const created = await createSlot(start, end);
                createdSlots.push(created);
            }

            await onSlotsCreated(createdSlots);
            onClose();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Không thể tạo danh sách lịch hẹn.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <aside className="h-[100vh] min-w-[50vw] max-w-[720px] overflow-y-auto border-l border-gray-300 bg-white p-2 shadow-2xl">
            <button
                className="rounded p-2 hover:bg-light-gray"
                onClick={onClose}
                type="button"
                aria-label="Đóng"
            >
                <EditCloseIcon />
            </button>

            <div className="px-8 py-4">
                <div className="mb-8 flex items-start gap-4">
                    <CalendarSVG />
                    <div className="min-w-0 flex-1">
                        <h1 className="mb-1 text-lg font-bold text-primary">TẠO NHIỀU LỊCH HẸN</h1>
                        <p className="text-txt-gray">Nhập mốc bắt đầu, thời lượng mỗi slot và số slot cần tạo.</p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="mb-5 rounded border border-[#f0b4b4] bg-[#fff5f5] px-4 py-3 text-sm text-[#c20404]">
                        {errorMessage}
                    </div>
                )}

                <section className="mb-8">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-txt-dark md:col-span-2">
                            Bắt đầu
                            <input
                                className="rounded border border-gray-300 px-3 py-2 font-normal text-txt-dark"
                                placeholder="dd/mm/yyyy, hh:mm AM/PM"
                                value={startValue}
                                onChange={(event) => setStartValue(event.target.value)}
                                disabled={isSaving}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-txt-dark">
                            Thời lượng mỗi slot (phút)
                            <input
                                className="rounded border border-gray-300 px-3 py-2 font-normal text-txt-dark"
                                type="number"
                                min={1}
                                step={1}
                                value={durationMinutes}
                                onChange={(event) => setDurationMinutes(event.target.value)}
                                disabled={isSaving}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-txt-dark">
                            Số lượng slot
                            <input
                                className="rounded border border-gray-300 px-3 py-2 font-normal text-txt-dark"
                                type="number"
                                min={1}
                                step={1}
                                value={slotCount}
                                onChange={(event) => setSlotCount(event.target.value)}
                                disabled={isSaving}
                            />
                        </label>
                    </div>
                    {previewText && <p className="mt-3 text-sm text-txt-gray">{previewText}</p>}
                    {previewSlots.length > 0 && (
                        <ul className="mt-3 space-y-2 rounded border border-gray-200 bg-bg-tinted p-3">
                            {previewSlots.map((slot, index) => (
                                <li key={`${slot.start.toISOString()}-${index}`} className="flex items-center gap-2 text-sm text-txt-dark">
                                    <Clock3 className="h-4 w-4 text-txt-gray" />
                                    <span>
                                        {slot.start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                        {" - "}
                                        {slot.end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="sticky bottom-0 -mx-8 flex gap-3 border-t border-gray-200 bg-white px-8 py-4">
                    <button
                        className="ml-auto inline-flex items-center gap-2 rounded bg-primary-dark px-4 py-3 text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-gray-300"
                        onClick={handleSave}
                        type="button"
                        disabled={isSaving}
                    >
                        <Save className="h-5 w-5" />
                        {isSaving ? "Đang tạo" : "Tạo slot"}
                    </button>
                </div>
            </div>
        </aside>
    );
}
