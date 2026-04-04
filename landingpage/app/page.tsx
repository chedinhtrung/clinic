"use client"
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Panel from "@/app/Panel";
import Intro from "@/app/Intro";
import Footer from "@/components/Footer";
import Booking from "@/app/Booking";
import { useState } from "react";

export default function Home() {
  const [selectedPage, setSelectedPage] = useState("home");
  return (
    <div>
      <Navbar
      selectedPage={selectedPage}
      setSelectedPage={setSelectedPage}
      ></Navbar>
      <Intro></Intro>
      <Booking></Booking>
    </div>
  );
}
