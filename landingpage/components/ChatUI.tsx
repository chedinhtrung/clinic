"use client"
import { useState } from "react"
import GrayAvatarSVG from "@/components/GrayAvatarSVG";
import { useRef } from "react";
import { useEffect } from "react";

type Message = {
  text: string
  from: "user" | "bot"
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest",});
  }, [messages]);

  const sendMessageEnter = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      console.log(e.key)
      e.preventDefault(); // prevent newline
      sendMessage();
    }
  }

  const sendMessage = async () => {
    console.log("SEND CLICKED")
    if (!input.trim()) return;

    const userText = input;

    setMessages((prev) => [
      ...prev,
      { text: userText, from: "user" },
    ])

    setInput("")

    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userText }),
    })
    console.log("sent")

    const data = await res.json()

    setMessages(prev => [
      ...prev,
      { text: data.reply, from: "bot" },
    ])
  }

  return (
    <div className="flex flex-col sm:bg-white rounded-lg shadow-lg sm:w-[500px]">
      <div className="bg-primary rounded-t-lg p-4 flex gap-2 items-center">
        <GrayAvatarSVG></GrayAvatarSVG>
        <div>
          <h6 className="font-bold text-white">
            Trợ lý bác sỹ
          </h6>
          <p className="text-white text-sm">
            Phòng khám BS. Chế Đình Nghĩa
          </p>
        </div>

      </div>
      {/* Messages */}

      <div className="overflow-y-auto p-4 space-y-2 sm:h-full h-[400px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`px-4 py-2 rounded-lg ${m.from === "user"
              ? "bg-primary text-white ml-20"
              : "bg-gray-200 mr-20"
              }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <div className="flex p-2 border-t">
        <input
          className="flex-1 p-3 shadow-lg rounded-full"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn"
          onKeyDown={sendMessageEnter}
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-4 bg-primary text-white rounded"
        >
          Gửi
        </button>
      </div>
    </div>
  )
}