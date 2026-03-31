
export type Slot = {
    id: string;
    start: Date;
    end: Date;
    status: "free" | "pending" | "confirmed" | "creating";
    title: string | undefined
};