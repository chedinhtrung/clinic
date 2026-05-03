
export type Slot = {
    id: string;
    start: Date;
    end: Date;
    createdAt?: string;
    bookingId?: string | null;
    status: "free" | "pending" | "confirmed" | "finished" | "creating";
    title?: string;
    reservationCode?: number | string | null;
    bookingExpiresAt?: string | null;
    confirmedAt?: string | null;

    patient_id?: string | null;
    patient_name?: string | null;
    patient_birthdate?: string | null;
    patient_email?: string | null;
    patient_phone?: string | null;
    patient_gender?: string | null;
    patient_note?: string | null;
    ai_summary?: string | null;
};

export type SlotPayload = Omit<Slot, "start" | "end" | "status"> & {
    start: string;
    end: string;
    status: "free" | "pending" | "confirmed" | "finished";
};
