import Image from "next/image";
import Navbar from "@/components/Navbar";
import Panel from "@/components/Panel";
import Intro from "@/components/Intro";

export default function Home() {
  return (
    <div>
      <Navbar></Navbar>
      <Panel></Panel>
      <Intro></Intro>
    </div>
   

  );
}
