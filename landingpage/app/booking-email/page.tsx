"use client"

import { BookingFlow } from "@/app/Booking";

export default function BookingEmailPage() {
    return (
        <div>
            <BookingFlow confirmationMode="email" />
        </div>
    );
}
