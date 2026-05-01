"use client"

import { BookingFlow } from "@/app/Booking";
import Navbar from "@/components/Navbar";

export default function BookingEmailPage() {
    return (
        <>
            <Navbar />
            <BookingFlow confirmationMode="email" />
        </>
    );
}
