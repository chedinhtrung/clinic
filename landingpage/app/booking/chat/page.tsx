"use client"

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BookingChat from "@/components/BookingChat";
import Navbar from "@/components/Navbar";

function BookingChatContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return (
    <main className="bg-tinted-gray px-4 py-8 sm:px-6 sm:py-12">
      <BookingChat token={token} />
    </main>
  );
}

export default function BookingChatPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<main className="min-h-[70vh] bg-tinted-gray p-6" />}>
        <BookingChatContent />
      </Suspense>
    </>
  );
}
