"use client"
import Image from "next/image";
import Navbar from "@/components/NavBar";
import Panel from "@/app/Panel";
import Intro from "@/app/Intro";
import Footer from "@/components/Footer";
import Booking from "@/app/Booking";
import Blogs from "@/app/Blogs";
import Injuries from "@/app/Injuries";
import { useState } from "react";

export default function Home() {
  const [selectedPage, setSelectedPage] = useState("home");
  return (
    <div>
      <Navbar
        selectedPage={selectedPage}
        setSelectedPage={setSelectedPage}
      ></Navbar>

      {
        selectedPage === "home" && (
          <div>
            <Intro />
            <Booking />
          </div>
        )
      }
      {
        selectedPage === "blog" && (
          <Blogs />
        )
      }
      {
        selectedPage === "injuries" && (
          <Injuries />
        )
      }
      
    </div>
  );
}
