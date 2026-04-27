"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import SlotManagement from "@/components/SlotMgmt";
import BlogEditor from "@/components/BlogEditor";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  return (
    <div className="flex h-[100vh]">
      <Navbar
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      ></Navbar>
      {selectedTab === "slots" && <SlotManagement />}
      {selectedTab === "blogs" && <BlogEditor />}
      {selectedTab === "dashboard" && (
        <main className="flex flex-1 items-center justify-center bg-bg-tinted p-10 text-txt-gray">
          Select a module from the sidebar.
        </main>
      )}
    </div>
  );
}
