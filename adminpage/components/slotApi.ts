import { Slot, SlotPayload } from "./Slot";

const ADMIN_API_BASE_URL = "/api/admin";

type SlotResponse = {
    slot: SlotPayload;
};

type ApiErrorResponse = {
    error?: string;
};

function toSlot(payload: SlotPayload): Slot {
    return {
        ...payload,
        start: new Date(payload.start),
        end: new Date(payload.end),
    };
}

async function readJson<T>(response: Response): Promise<T> {
    const data = (await response.json().catch(() => ({}))) as T & ApiErrorResponse;

    if (!response.ok) {
        throw new Error(data.error || "Không thể thực hiện thao tác lịch hẹn.");
    }

    return data;
}

export async function fetchSlotsByRange(start: string, end: string): Promise<Slot[]> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/get_slots`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ start, end }),
    });
    const data = await readJson<SlotPayload[]>(response);

    return data.map(toSlot);
}

export async function fetchSlot(slotId: string): Promise<Slot> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/slots/${slotId}`);
    const data = await readJson<SlotResponse>(response);

    return toSlot(data.slot);
}

export async function createSlot(start: Date, end: Date): Promise<Slot> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/slots`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            start: start.toISOString(),
            end: end.toISOString(),
        }),
    });
    const data = await readJson<SlotResponse>(response);

    return toSlot(data.slot);
}

export async function updateSlot(slotId: string, start: Date, end: Date): Promise<Slot> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/slots/${slotId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            start: start.toISOString(),
            end: end.toISOString(),
        }),
    });
    const data = await readJson<SlotResponse>(response);

    return toSlot(data.slot);
}

export async function deleteSlot(slotId: string): Promise<void> {
    const response = await fetch(`${ADMIN_API_BASE_URL}/slots/${slotId}`, {
        method: "DELETE",
    });

    await readJson<{ ok: boolean }>(response);
}
