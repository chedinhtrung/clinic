"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import SlotManagement from "@/components/SlotMgmt";
import BlogEditor from "@/components/BlogEditor";
import PatientManagement from "@/components/PatientManagement";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  const [bookingToOpenId, setBookingToOpenId] = useState<string | null>(null);
  const [patientToOpenId, setPatientToOpenId] = useState<string | null>(null);

  function openBookingInSlots(bookingId: string) {
    setBookingToOpenId(bookingId);
    setSelectedTab("slots");
  }

  function openPatientInPatients(patientId: string) {
    setPatientToOpenId(patientId);
    setSelectedTab("patients");
  }

  return (
    <div className="flex h-[100vh]">
      <Navbar
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      ></Navbar>
      {selectedTab === "slots" && (
        <SlotManagement
          bookingToOpenId={bookingToOpenId}
          onBookingOpened={() => setBookingToOpenId(null)}
          onOpenPatient={openPatientInPatients}
        />
      )}
      {selectedTab === "patients" && (
        <PatientManagement
          onOpenBooking={openBookingInSlots}
          patientToOpenId={patientToOpenId}
          onPatientOpened={() => setPatientToOpenId(null)}
        />
      )}
      {selectedTab === "blogs" && <BlogEditor />}
      {selectedTab === "dashboard" && (
        <main className="flex flex-1 items-center justify-center bg-bg-tinted p-10 text-txt-gray">
          Select a module from the sidebar.
        </main>
      )}
    </div>
  );
}
