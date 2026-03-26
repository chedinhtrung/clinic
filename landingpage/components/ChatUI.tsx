"use client"
import { useState } from "react"

type Message = {
  text: string
  from: "user" | "bot"
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  const sendMessage = async () => {
     console.log("SEND CLICKED")
    if (!input.trim()) return;

    const userText = input;

    setMessages((prev) => [
      ...prev,
      { text: userText, from: "user" },
    ])

    setInput("")

    const res = await fetch("http://92.205.129.243:5000/api/chat", {
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
    <div className="h-screen flex flex-col">

      {/* Messages */}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[70%] px-4 py-2 rounded-lg ${
              m.from === "user"
                ? "bg-primary text-white ml-auto"
                : "bg-gray-200"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex p-2 border-t">
        <input
          className="flex-1 p-2 border rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-4 bg-primary text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  )
}