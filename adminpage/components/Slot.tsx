
export type Slot = {
    id: string;
    start: Date;
    end: Date;
    status: "free" | "pending" | "confirmed" | "creating";
    title: string | undefined;

    patient_name: string | undefined;
    patient_birthdate: string | undefined;
    patient_email: string | undefined;
    ai_summary: string | undefined; 
};