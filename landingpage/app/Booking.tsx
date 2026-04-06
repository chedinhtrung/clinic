"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DayPicker } from "react-day-picker"
import { vi } from "date-fns/locale"

type Slot = {
    id: string;
    startAt: string;
    endAt: string;
}

// Convert a calendar day into the YYYY-MM-DD format expected by the backend.
function toDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatSlotTime(isoTimestamp: string) {
    return new Date(isoTimestamp).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function Booking() {
    const router = useRouter();
    // All bookable days returned by the backend.
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    // The day currently selected in the calendar.
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    // The slots currently shown for the selected day.
    const [slotlist, setSlotlist] = useState<Slot[]>([]);
    // The slot currently selected by the user.
    const [selectedSlot, setSelectedSlot] = useState<Slot | undefined>();
    // Visible loading state for the user-triggered slot fetch.
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    // Cached slot lists keyed by YYYY-MM-DD so repeat visits to a day are instant.
    const [cachedSlotsByDate, setCachedSlotsByDate] = useState<Record<string, Slot[]>>({});
    // The month currently visible in DayPicker, used for background prefetching.
    const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());
    // Visible loading state while the selected slot is being claimed.
    const [isClaimingSlot, setIsClaimingSlot] = useState(false);

    // Reload the available date list from the backend after availability changes.
    async function reloadAvailableDates() {
        const res = await fetch("http://localhost:5001/api/get_available_dates", {
            credentials: "include",
        });
        const data: string[] = await res.json();

        const parsed = data.map((d) => {
            const [year, month, day] = d.split("-").map(Number);
            return new Date(year, month - 1, day);
        });
        setAvailableDates(parsed);
    }

    // Fetch the slots for a single calendar day from the backend.
    async function fetchSlotsForDate(dateKey: string) {
        const res = await fetch("http://localhost:5001/api/get_available_slots", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            // Must send raw date strings, not date objects. Timezones are cursed
            body: JSON.stringify(dateKey),
        });

        const data: Slot[] = await res.json();
        return data;
    }

    // Drop the stale cache for one day and reload its slots from the backend.
    async function refreshDateAvailability(date: Date) {
        const dateKey = toDateKey(date);

        setCachedSlotsByDate((current) => {
            const next = { ...current };
            delete next[dateKey];
            return next;
        });

        const freshSlots = await fetchSlotsForDate(dateKey);
        setSlotlist(freshSlots);
        setCachedSlotsByDate((current) => ({
            ...current,
            [dateKey]: freshSlots,
        }));
        setSelectedSlot(undefined);
        await reloadAvailableDates();
    }

    // Load slots for the selected day, using the cache first when possible.
    async function onDateSelect(date: Date | undefined) {
        setSlotlist([]);
        if (date === undefined) {
            return;
        }

        setSelectedSlot(undefined);
        setSelectedDate(date);
        const dateKey = toDateKey(date);

        // Cache slot lists by date on the client so revisiting a day feels instant
        // and doesn't hit the backend again unless the page is reloaded.
        if (cachedSlotsByDate[dateKey]) {
            setSlotlist(cachedSlotsByDate[dateKey]);
            return;
        }

        setIsLoadingSlots(true);

        try {
            const data = await fetchSlotsForDate(dateKey);
            setSlotlist(data);
            setCachedSlotsByDate((current) => ({
                ...current,
                [dateKey]: data,
            }));
        } finally {
            setIsLoadingSlots(false);
        }
    }

    // Toggle the currently selected slot card.
    function onSlotSelect(slot: Slot) {
        if (selectedSlot && slot.id === selectedSlot.id) {
            setSelectedSlot(undefined);
        }
        else {
            setSelectedSlot(slot);
        }

    }

    // Claim the selected slot for the current anonymous booking session.
    async function onClaimSlot() {
        if (!selectedSlot) {
            return;
        }

        setIsClaimingSlot(true);
        try {
            const res = await fetch("http://localhost:5001/api/claim_booking", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    slotId: selectedSlot.id,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error ?? "Khong dat duoc lich");
            }

            const booking = data.booking;
            const params = new URLSearchParams({
                bookingId: booking.id,
            });
            router.push(`/booking?${params.toString()}`);
        } catch (error) {
            if (selectedDate) {
                await refreshDateAvailability(selectedDate);
            }

            const message = error instanceof Error
                ? error.message
                : "Khung giờ này hiện không còn khả dụng. Vui lòng chọn khung giờ khác.";
            alert(message);
        } finally {
            setIsClaimingSlot(false);
        }
    }

    useEffect(() => {
        // Load the set of calendar dates that have at least one available slot.
        const fetchDates = async () => {
            await fetch("http://localhost:5001/api/session", {
                credentials: "include",
            });

            await reloadAvailableDates();
        }

        fetchDates();
    }, [])

    useEffect(() => {
        if (availableDates.length === 0) {
            return;
        }

        const visibleDates = availableDates.filter((date) =>
            date.getFullYear() === displayedMonth.getFullYear() &&
            date.getMonth() === displayedMonth.getMonth()
        );

        const uncachedDateKeys = visibleDates
            .map(toDateKey)
            .filter((dateKey) => !cachedSlotsByDate[dateKey]);

        if (uncachedDateKeys.length === 0) {
            return;
        }

        let isCancelled = false;

        // Warm the cache in the background for the dates visible in the current month.
        const prefetchVisibleMonthSlots = async () => {
            const prefetchedEntries = await Promise.all(
                uncachedDateKeys.map(async (dateKey) => ({
                    dateKey,
                    slots: await fetchSlotsForDate(dateKey),
                }))
            );

            if (isCancelled) {
                return;
            }

            setCachedSlotsByDate((current) => {
                const next = { ...current };
                for (const entry of prefetchedEntries) {
                    next[entry.dateKey] = entry.slots;
                }
                return next;
            });
        };

        prefetchVisibleMonthSlots();

        return () => {
            isCancelled = true;
        };
    }, [availableDates, cachedSlotsByDate, displayedMonth])

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
                            month={displayedMonth}
                            onMonthChange={setDisplayedMonth}
                            locale={vi}
                            disabled={[
                                { before: new Date() },
                                (date) => !availableDates.some(
                                    (availableDate) =>
                                        availableDate.getFullYear() === date.getFullYear() &&
                                        availableDate.getMonth() === date.getMonth() &&
                                        availableDate.getDate() === date.getDate()
                                ),
                            ]}
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
                        <div className="flex flex-col gap-2 overflow-y-auto max-h-[250px] sm:w-[130px]">
                            {!selectedDate && (
                                <p className="text-sm text-gray-500">
                                    Vui lòng chọn ngày để xem khung giờ.
                                </p>
                            )}
                            {isLoadingSlots && (
                                <p className="text-sm text-gray-500 text-center">
                                    Đang tải khung giờ...
                                </p>
                            )}
                            {slotlist.map((s) => (
                                <div
                                    key={s.id}
                                    className={`px-4 py-2 rounded-lg ${selectedSlot && s.id === selectedSlot.id ? `bg-primary text-white` : `bg-primary-light`} hover:bg-primary hover:text-white text-center`}
                                    onClick={() => { onSlotSelect(s) }}
                                >
                                    {formatSlotTime(s.startAt)} - {formatSlotTime(s.endAt)}
                                </div>
                            ))}
                        </div>
                        {
                            selectedSlot ? (
                                <button
                                    type="button"
                                    className="p-2 block mt-4 w-full bg-primary text-white rounded-lg font-bold text-center disabled:opacity-60"
                                    onClick={onClaimSlot}
                                    disabled={isClaimingSlot}
                                >
                                    {isClaimingSlot ? "Đang tải..." : "ĐẶT LỊCH"}
                                </button>
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
