"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DayPicker } from "react-day-picker"
import { vi } from "date-fns/locale"
import { withApiBase } from "@/app/apiBase"

type Slot = {
    id: string;
    startAt: string;
    endAt: string;
}

const bookingSteps = [
    {
        number: "01",
        title: "Bước 1: Đăng ký tư vấn",
        description: "Chọn ngày và khung giờ phù hợp.",
        icon: (
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M8 2v4M16 2v4M3 10h18" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
            </svg>
        ),
    },
    {
        number: "02",
        title: "Bước 2: Khai thác bệnh sử",
        description: "Cung cấp thông tin, hồ sơ và triệu chứng.",
        icon: (
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
    {
        number: "03",
        title: "Bước 3: Tư vấn online",
        description: "Đọc phim, tư vấn điều trị và kê đơn thuốc nếu phù hợp.",
        icon: (
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m22 8-6 4 6 4V8Z" />
                <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
        ),
    },
    {
        number: "04",
        title: "Bước 4: Tư vấn trực tiếp",
        description: "Khám và điều trị tại phòng khám khi cần thiết.",
        icon: (
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m12 2 3.09 6.26 6.91 1-5 4.88 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.26l6.91-1L12 2Z" />
            </svg>
        ),
    },
];

const bookingBenefits = [
    {
        title: "Chuyên gia hàng đầu",
        description: "Bác sỹ nhiều năm kinh nghiệm từ bệnh viện tuyến đầu.",
        icon: (
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-5" />
            </svg>
        ),
    },
    {
        title: "Tiết kiệm thời gian",
        description: "Tư vấn tại nhà, hướng dẫn chụp chiếu tại bệnh viện gần nhất.",
        icon: (
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </svg>
        ),
    },
    {
        title: "Theo dõi sát sao",
        description: "Theo dõi và điều chỉnh hướng điều trị dựa trên tình trạng của bạn.",
        icon: (
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5Z" />
            </svg>
        ),
    },
    {
        title: "Không cần chờ đợi",
        description: "Chọn lịch tư vấn phù hợp nhất với bạn.",
        icon: (
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
            </svg>
        ),
    },
];

function getBrowserTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Convert a calendar day into the YYYY-MM-DD format expected by the backend.
function toDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getBrowserLocalDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatSlotTime(isoTimestamp: string) {
    return new Date(isoTimestamp).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: getBrowserTimeZone(),
    });
}

export default function Booking() {
    return <BookingFlow confirmationMode="email" />;
}

export function BookingFlow({
    confirmationMode = "email",
}: {
    confirmationMode?: "payment" | "email";
}) {
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
    // Force DayPicker to use the browser's local calendar day instead of any
    // server/container/build-time default.
    const [browserToday, setBrowserToday] = useState<Date | undefined>();

    // Reload the available date list from the backend after availability changes.
    async function reloadAvailableDates() {
        const res = await fetch(withApiBase("/api/get_available_dates"), {
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
        const res = await fetch(withApiBase("/api/get_available_slots"), {
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
        if (date === undefined) {
            // DayPicker can emit undefined when clicking the already selected day.
            // Keep the current selection/slots so repeated clicks are idempotent.
            return;
        }

        setSlotlist([]);

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
            const res = await fetch(withApiBase("/api/claim_booking"), {
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
                flow: confirmationMode,
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
        setBrowserToday(getBrowserLocalDay(new Date()));

        // Load the set of calendar dates that have at least one available slot.
        const fetchDates = async () => {
            await fetch(withApiBase("/api/session"), {
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
        <section id="booking" className="scroll-mt-24 bg-[#fdfbf8] px-6 py-14 text-[#092452] sm:px-10 lg:px-20">
            <div className="mx-auto w-full max-w-7xl">
                <div className="mb-10 text-center">
                    <h2 className="font-serif text-2xl font-black tracking-tight text-[#092452] sm:text-3xl">
                        Đăng ký tư vấn online
                    </h2>
                    <div className="mt-2 flex items-center justify-center gap-3 text-[#d29a24]">
                        <span className="inline-block h-0.5 w-14 shrink-0 bg-[#d29a24]" />
                        <span className="text-lg leading-none">★</span>
                        <span className="inline-block h-0.5 w-14 shrink-0 bg-[#d29a24]" />
                    </div>
                </div>

                <div className="mb-8 grid gap-8 lg:grid-cols-[0.92fr_1.25fr]">
                    <div className="flex flex-col">
                        <div className="mb-5 flex items-center gap-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d3a34a] text-[#d3a34a]">
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="m12 7 1.1 3.2 3.4.1-2.7 2 1 3.2-2.8-1.9-2.8 1.9 1-3.2-2.7-2 3.4-.1L12 7Z" />
                                </svg>
                            </span>
                            <h3 className="text-base font-black uppercase tracking-[0.22em] text-[#092452]">
                                Quy trình khám
                            </h3>
                        </div>

                        <div className="h-full rounded-[8px] border border-[#ecdfc8] bg-[#fbf5ec] p-6 shadow-[0_20px_55px_rgba(9,36,82,0.10)] sm:p-8 flex items-center">
                            <div className="space-y-4">
                                {bookingSteps.map((step, index) => (
                                    <div key={step.number}>
                                        <div className="grid grid-cols-[60px_1fr] items-start gap-4 sm:grid-cols-[70px_1fr] sm:gap-4">
                                            <div className="relative flex justify-center items-center">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#092452] text-white shadow-[0_12px_24px_rgba(9,36,82,0.20)] sm:h-[50px]">
                                                    {step.icon}
                                                </div>
                                                
                                            </div>
                
                                            <div className="">
                                                <h4 className="text-base font-black text-[#092452] sm:text-lg">
                                                    {step.title}
                                                </h4>
                                                <p className="mt-1 max-w-md text-sm leading-6 text-[#43536f] sm:text-base">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                        {index < bookingSteps.length - 1 && (
                                            <div className="ml-[100px] mt-3 h-px bg-[#e1d9ca] sm:ml-[80px]" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <div className="mb-5 flex items-center gap-4">
                            <span className="flex h-10 w-10 items-center justify-center text-[#d3a34a]">
                                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="3" y="4" width="18" height="17" rx="2" />
                                    <path d="M8 2v4M16 2v4M3 10h18M9 15l2 2 4-5" />
                                </svg>
                            </span>
                            <h3 className="text-base font-black uppercase tracking-[0.22em] text-[#092452]">
                                Đặt lịch
                            </h3>
                        </div>

                        <div className="grid h-full gap-0 rounded-[8px] border border-[#dfe4ec] bg-white p-5 shadow-[0_20px_55px_rgba(9,36,82,0.10)] md:grid-cols-[1fr_260px] md:p-7">
                            <div className="flex justify-center md:justify-start md:pr-7">
                                <div className="booking-calendar w-full max-w-[450px]">
                                <DayPicker
                                    mode="single"
                                    today={browserToday}
                                    selected={selectedDate}
                                    onSelect={onDateSelect}
                                    month={displayedMonth}
                                    onMonthChange={setDisplayedMonth}
                                    locale={vi}
                                    disabled={[
                                        ...(browserToday ? [{ before: browserToday }] : []),
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
                                        available: "bg-[#f6ead6] text-[#092452] rounded-full font-semibold"
                                    }}
                                    required={false}
                                />
                            </div>
                            </div>

                            <div className="mt-8 border-[#e1e6ef] md:mt-0 md:border-l md:pl-8">
                            <div className="flex items-center">
                                <h3 className="text-base font-black uppercase tracking-[0.22em] text-[#092452]">
                                    Khung giờ
                                </h3>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-[#6a7892]">
                                Vui lòng chọn ngày để xem khung giờ.
                            </p>
                            <div className="mt-6 flex max-h-[276px] flex-col gap-2 overflow-y-auto pr-2">
                                {!selectedDate && (
                                    <p className="py-4 text-sm text-[#6a7892]">
                                        Chưa có ngày được chọn.
                                    </p>
                                )}
                                {isLoadingSlots && (
                                    <p className="py-4 text-center text-sm text-[#6a7892]">
                                        Đang tải khung giờ...
                                    </p>
                                )}
                                {slotlist.map((s) => {
                                    const isSelected = Boolean(selectedSlot && s.id === selectedSlot.id);
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            className={[
                                                "flex items-center justify-center gap-3 rounded-[6px] px-4 py-2.5 text-sm font-semibold text-center transition",
                                                "border",
                                                isSelected
                                                    ? "border-[#092452] bg-[#092452] text-white shadow-[0_10px_18px_rgba(9,36,82,0.18)]"
                                                    : "border-[#cbd4e2] bg-white text-[#092452] hover:border-[#092452]/40 hover:bg-[#f7f9fc]",
                                            ].join(" ")}
                                            onClick={() => { onSlotSelect(s) }}
                                        >
                                            <span>{formatSlotTime(s.startAt)} - {formatSlotTime(s.endAt)}</span>
                                            {isSelected && (
                                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                    <path d="m20 6-11 11-5-5" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedSlot ? (
                                <button
                                    type="button"
                                    className="mt-9 flex w-full items-center justify-center gap-3 rounded-[6px] bg-[#d29a24] px-5 py-4 font-black text-white shadow-[0_12px_22px_rgba(210,154,36,0.24)] transition hover:bg-[#bd8517] disabled:opacity-60"
                                    onClick={onClaimSlot}
                                    disabled={isClaimingSlot}
                                >
                                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect x="3" y="4" width="18" height="17" rx="2" />
                                        <path d="M8 2v4M16 2v4M3 10h18M9 15l2 2 4-5" />
                                    </svg>
                                    {isClaimingSlot ? "Đang tải..." : "ĐẶT LỊCH"}
                                </button>
                            ) : (
                                <div className="h-[88px]"></div>
                            )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 rounded-[8px] border border-[#e2e7ef] bg-white p-6 shadow-[0_16px_42px_rgba(9,36,82,0.08)] md:grid-cols-2 lg:grid-cols-4 lg:p-7">
                    {bookingBenefits.map((benefit, index) => (
                        <div
                            key={benefit.title}
                            className={`flex gap-5 ${index > 0 ? "lg:border-l lg:border-[#e2e7ef] lg:pl-7" : ""}`}
                        >
                            <div className="shrink-0 text-[#092452]">
                                {benefit.icon}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-[#092452]">
                                    {benefit.title}
                                </h4>
                                <p className="mt-1 text-sm leading-6 text-[#66738d]">
                                    {benefit.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
