"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Save, Trash2, User } from "lucide-react";
import { Slot } from "./Slot";
import EditCloseIcon from "./icons/EditCloseIcon";
import CalendarSVG from "./icons/CalendarSVG";
import { createSlot, deleteSlot, updateSlot } from "./slotApi";

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

function formatDateTime(value?: string | null): string {
    if (!value) {
        return "Chưa có";
    }

    return toDisplayDateTimeValue(new Date(value));
}

function calculateAge(birthdate?: string | null): number | undefined {
    if (!birthdate) {
        return undefined;
    }

    const birth = new Date(birthdate);
    if (Number.isNaN(birth.getTime())) {
        return undefined;
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDelta = today.getMonth() - birth.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
    }

    return age;
}

function statusClassName(status: Slot["status"]): string {
    if (status === "free") {
        return "bg-[#0d6e56]";
    }
    if (status === "pending") {
        return "bg-[#f59e0b]";
    }
    if (status === "creating") {
        return "bg-[#4d756bff]";
    }

    return "bg-[#ef4444]";
}

function statusIcon(status: Slot["status"]) {
    if (status === "pending") {
        return <CreditCard className="h-5 w-5" />;
    }
    if (status === "confirmed") {
        return <User className="h-5 w-5" />;
    }

    return <span aria-hidden="true">✓</span>;
}

export default function SlotEditor(
    {
        slot,
        setSelectedSlot,
        setTempSlot,
        onSlotSaved,
        onSlotDeleted,
    }:
        {
            slot: Slot,
            setSelectedSlot: (slot: Slot | undefined) => void,
            setTempSlot: (slot: Slot | undefined) => void,
            onSlotSaved: (slot: Slot) => Promise<void>,
            onSlotDeleted: () => Promise<void>,
        }
) {
    const [startValue, setStartValue] = useState(toDisplayDateTimeValue(slot.start));
    const [endValue, setEndValue] = useState(toDisplayDateTimeValue(slot.end));
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isCreating = slot.status === "creating";
    const isBooked = slot.status === "pending" || slot.status === "confirmed";
    const patientAge = useMemo(() => calculateAge(slot.patient_birthdate), [slot.patient_birthdate]);

    useEffect(() => {
        setStartValue(toDisplayDateTimeValue(slot.start));
        setEndValue(toDisplayDateTimeValue(slot.end));
        setErrorMessage(undefined);
    }, [slot]);

    const buildEditedSlot = (nextStartValue: string, nextEndValue: string): Slot | undefined => {
        const nextStart = parseDisplayDateTimeValue(nextStartValue);
        const nextEnd = parseDisplayDateTimeValue(nextEndValue);

        if (!nextStart || !nextEnd) {
            return undefined;
        }

        return {
            ...slot,
            start: nextStart,
            end: nextEnd,
        };
    };

    const updateDraftPreview = (nextStartValue: string, nextEndValue: string) => {
        const editedSlot = buildEditedSlot(nextStartValue, nextEndValue);
        if (!editedSlot) {
            return;
        }

        setSelectedSlot(editedSlot);
        if (editedSlot.status === "creating") {
            setTempSlot(editedSlot);
        }
    };

    const handleStartChange = (value: string) => {
        setStartValue(value);
        updateDraftPreview(value, endValue);
    };

    const handleEndChange = (value: string) => {
        setEndValue(value);
        updateDraftPreview(startValue, value);
    };

    const handleClose = () => {
        setSelectedSlot(undefined);
        setTempSlot(undefined);
    };

    const handleSave = async () => {
        const editedSlot = buildEditedSlot(startValue, endValue);
        if (!editedSlot) {
            setErrorMessage("Thời gian phải theo định dạng dd/mm/yyyy, hh:mm AM/PM.");
            return;
        }

        if (editedSlot.end <= editedSlot.start) {
            setErrorMessage("Giờ kết thúc phải sau giờ bắt đầu.");
            return;
        }

        setIsSaving(true);
        setErrorMessage(undefined);
        try {
            const savedSlot = isCreating
                ? await createSlot(editedSlot.start, editedSlot.end)
                : await updateSlot(editedSlot.id, editedSlot.start, editedSlot.end);

            await onSlotSaved(savedSlot);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Không thể lưu lịch hẹn.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (isCreating) {
            setSelectedSlot(undefined);
            setTempSlot(undefined);
            return;
        }

        const confirmed = window.confirm("Xóa lịch hẹn này?");
        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
        setErrorMessage(undefined);
        try {
            await deleteSlot(slot.id);
            await onSlotDeleted();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Không thể xóa lịch hẹn.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <aside className="absolute right-0 top-0 z-10 h-[100vh] min-w-[50vw] max-w-[720px] overflow-y-auto border-l border-gray-300 bg-white p-2 shadow-2xl">
            <button
                className="rounded p-2 hover:bg-light-gray"
                onClick={handleClose}
                type="button"
                aria-label="Đóng"
            >
                <EditCloseIcon />
            </button>

            <div className="px-8 py-4">
                <div className="mb-8 flex items-start gap-4">
                    <CalendarSVG />
                    <div className="min-w-0 flex-1">
                        <h1 className="mb-1 text-lg font-bold text-primary">
                            {isCreating ? "TẠO LỊCH HẸN MỚI" : "THÔNG TIN LỊCH HẸN"}
                        </h1>

                        <p className="text-md font-bold">
                            {slot.start.toLocaleString("vi-VN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                            <br />
                            {slot.start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            &nbsp;&nbsp; - &nbsp;&nbsp;
                            {slot.end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>

                        <p className="text-txt-gray">Tư vấn online</p>
                    </div>
                </div>
                
                <div className="flex gap-6">
                <div className={`mb-6 inline-flex max-w-full items-center gap-2 rounded-xl px-3 py-2 text-white ${statusClassName(slot.status)}`}>
                    {statusIcon(slot.status)}
                    <span className="truncate">{slot.title || "Lịch hẹn"}</span>
                    
                </div>

                {!isBooked && (
                        <p className="mt-3 text-sm text-txt-gray">
                            Khi lưu, lịch hẹn trống sẽ hiển thị cho bệnh nhân chọn và đặt lịch.
                        </p>
                    )}
                </div>

                {errorMessage && (
                    <div className="mb-5 rounded border border-[#f0b4b4] bg-[#fff5f5] px-4 py-3 text-sm text-[#c20404]">
                        {errorMessage}
                    </div>
                )}

                <section className="mb-8">
                    <h2 className="mb-3 text-sm font-bold uppercase text-txt-gray">Thời gian</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-txt-dark">
                            Bắt đầu
                            <input
                                className="rounded border border-gray-300 px-3 py-2 font-normal text-txt-dark disabled:bg-tinted-gray"
                                placeholder="dd/mm/yyyy, hh:mm AM/PM"
                                value={startValue}
                                onChange={(event) => handleStartChange(event.target.value)}
                                disabled={isBooked || isSaving || isDeleting}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-txt-dark">
                            Kết thúc
                            <input
                                className="rounded border border-gray-300 px-3 py-2 font-normal text-txt-dark disabled:bg-tinted-gray"
                                placeholder="dd/mm/yyyy, hh:mm AM/PM"
                                value={endValue}
                                onChange={(event) => handleEndChange(event.target.value)}
                                disabled={isBooked || isSaving || isDeleting}
                            />
                        </label>
                    </div>
                    {isBooked && (
                        <p className="mt-3 text-sm text-txt-gray">
                            Lịch hẹn đã có đặt chỗ nên không thể sửa thời gian hoặc xóa từ trang này.
                        </p>
                    )}
                    
                </section>

                {(slot.bookingId || slot.patient_name || slot.status === "pending" || slot.status === "confirmed") && (
                    <section className="mb-8">
                        <h2 className="mb-3 text-sm font-bold uppercase text-txt-gray">Thông tin đặt lịch</h2>
                        <div className="grid gap-3 text-sm text-txt-dark md:grid-cols-2">
                            <div>
                                <p className="font-semibold text-txt-gray">Mã đặt chỗ</p>
                                <p>{slot.reservationCode || "Chưa có"}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-txt-gray">Trạng thái</p>
                                <p>{slot.status === "pending" ? "Chờ xác nhận" : "Đã xác nhận"}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-txt-gray">Hết hạn giữ chỗ</p>
                                <p>{formatDateTime(slot.bookingExpiresAt)}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-txt-gray">Xác nhận lúc</p>
                                <p>{formatDateTime(slot.confirmedAt)}</p>
                            </div>
                        </div>
                    </section>
                )}

                {(slot.patient_name || slot.patient_email || slot.patient_phone || slot.patient_note || slot.ai_summary) && (
                    <section className="mb-8">
                        <button
                            type="button"
                            onClick={() => {}}
                            className="mb-3 inline-flex items-center gap-1 text-sm font-bold uppercase text-txt-gray transition hover:text-primary"
                        >
                            <span>Thông tin bệnh nhân</span>
                            <span aria-hidden="true">🔗</span>
                        </button>
                        <div className="grid gap-3 text-sm text-txt-dark md:grid-cols-2">
                            <div>
                                <p className="font-semibold text-txt-gray">Tên</p>
                                <p>{slot.patient_name || "Chưa có"}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-txt-gray">Tuổi</p>
                                <p>{patientAge !== undefined ? patientAge : "Chưa có"}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-txt-gray">Email</p>
                                <p className="break-words">{slot.patient_email || "Chưa có"}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-txt-gray">Số điện thoại</p>
                                <p>{slot.patient_phone || "Chưa có"}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-txt-gray">Giới tính</p>
                                <p>{slot.patient_gender || "Chưa có"}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-txt-gray">Ngày sinh</p>
                                <p>{slot.patient_birthdate || "Chưa có"}</p>
                            </div>
                        </div>
                        {slot.patient_note && (
                            <div className="mt-4 rounded bg-bg-tinted p-4 text-sm text-txt-dark">
                                <p className="mb-2 font-semibold text-txt-gray">Ghi chú</p>
                                <p className="whitespace-pre-wrap">{slot.patient_note}</p>
                            </div>
                        )}
                        {slot.ai_summary && (
                            <div className="mt-4 rounded bg-bg-tinted p-4 text-sm text-txt-dark">
                                <p className="mb-2 font-semibold text-txt-gray">AI summary</p>
                                <p className="whitespace-pre-wrap">{slot.ai_summary}</p>
                            </div>
                        )}
                    </section>
                )}

                <div className="sticky bottom-0 -mx-8 flex gap-3 border-t border-gray-200 bg-white px-8 py-4">
                    <button
                        className="inline-flex items-center gap-2 rounded bg-[#c20404] px-4 py-3 text-white hover:bg-[#d90404] disabled:cursor-not-allowed disabled:bg-gray-300"
                        onClick={handleDelete}
                        type="button"
                        disabled={isBooked || isSaving || isDeleting}
                    >
                        <Trash2 className="h-5 w-5" />
                        {isDeleting ? "Đang xóa" : "Xóa"}
                    </button>
                    <button
                        className="ml-auto inline-flex items-center gap-2 rounded bg-primary-dark px-4 py-3 text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-gray-300"
                        onClick={handleSave}
                        type="button"
                        disabled={isBooked || isSaving || isDeleting}
                    >
                        <Save className="h-5 w-5" />
                        {isSaving ? "Đang lưu" : "Lưu"}
                    </button>
                </div>
            </div>
        </aside>
    );
}
