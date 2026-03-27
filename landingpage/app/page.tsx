import Image from "next/image";
import Navbar from "@/components/Navbar";
import Panel from "@/app/Panel";
import Intro from "@/app/Intro";
import Footer from "@/components/Footer";
import Booking from "@/app/Booking";

export default function Home() {
  return (
    <div>
      <Panel></Panel>
      <Intro></Intro>
      <Booking></Booking>
    </div>
   

  );
}
