"use client";
import Image from "next/image";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import SlotManagement from "@/components/SlotMgmt";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  return (
    <div className="flex h-[100vh]">
      <Navbar
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      ></Navbar>
      {selectedTab === "slots" && <SlotManagement />}
    </div>
  );
}
