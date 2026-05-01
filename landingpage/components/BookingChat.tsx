"use client"

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { withChatApiBase } from "@/app/apiBase";
import GrayAvatarSVG from "@/components/GrayAvatarSVG";

type ChatStatus = "active" | "finished" | "abuse";

type ChatMessage = {
  role: "user" | "assistant";
  message: string;
  created_at?: string;
}

type BookingChatProps = {
  token: string;
}

export default function BookingChat({ token }: BookingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("active");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, status, errorMessage]);

  useEffect(() => {
    if (!token) {
      setErrorMessage("Link trợ lý không hợp lệ hoặc thiếu thông tin.");
      setIsLoading(false);
      return;
    }

    let isCurrent = true;

    async function loadChat() {
      try {
        const query = new URLSearchParams({ token });
        const res = await fetch(withChatApiBase(`/api/chat?${query.toString()}`));
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error ?? "Không thể mở trợ lý cho lịch hẹn này.");
        }

        if (!isCurrent) {
          return;
        }

        setMessages(data?.chat?.messages ?? []);
        setStatus(data?.chat?.status ?? "active");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Không thể mở trợ lý cho lịch hẹn này.");
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadChat();

    return () => {
      isCurrent = false;
    };
  }, [token]);

  async function sendMessage() {
    const userText = input.trim();
    if (!userText || isSending || status === "abuse") {
      return;
    }

    const optimisticMessage: ChatMessage = {
      role: "user",
      message: userText,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch(withChatApiBase("/api/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, message: userText }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Không gửi được tin nhắn.");
      }

      setMessages(data?.result?.messages ?? []);
      setStatus(data?.result?.status ?? "active");
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message !== optimisticMessage));
      setErrorMessage(error instanceof Error ? error.message : "Không gửi được tin nhắn.");
    } finally {
      setIsSending(false);
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const inputDisabled = isLoading || isSending || status === "abuse" || Boolean(errorMessage && messages.length === 0);
  const statusMessage =
    status === "finished"
      ? "Em đã cập nhật phần tóm tắt cho bác sĩ. Mình vẫn có thể bổ sung hoặc chỉnh lại thông tin nếu cần."
      : status === "abuse"
        ? "Phiên trò chuyện đã được tạm dừng do nhiều nội dung không phù hợp."
        : null;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] min-h-[520px] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-lg sm:h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 bg-primary p-4">
        <GrayAvatarSVG />
        <div>
          <h1 className="text-base font-bold text-white">Trợ lý Thanh Vân</h1>
          <p className="text-sm text-white">Phòng khám BS. Chế Đình Nghĩa</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-tinted-gray p-4">
        {isLoading ? (
          <p className="text-sm text-txt-gray">Đang tải cuộc trò chuyện...</p>
        ) : null}

        {messages.map((chatMessage, index) => (
          <div
            key={`${chatMessage.role}-${index}`}
            className={`rounded-lg px-4 py-2 ${
              chatMessage.role === "user"
                ? "ml-12 bg-primary text-white"
                : "mr-12 bg-white text-txt-gray shadow-sm"
            }`}
          >
            <p className="whitespace-pre-wrap">{chatMessage.message}</p>
          </div>
        ))}

        {isSending ? (
          <div className="mr-12 rounded-lg bg-white px-4 py-2 text-sm text-txt-gray shadow-sm">
            Typing...
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-lg bg-white px-4 py-3 text-sm text-txt-gray shadow-sm">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t bg-white p-3">
        <input
          className="min-w-0 flex-1 rounded-full border border-gray-200 px-4 py-3 outline-none focus:border-primary disabled:bg-gray-100"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Nhập tin nhắn"
          onKeyDown={onInputKeyDown}
          disabled={inputDisabled}
        />
        <button
          type="button"
          onClick={sendMessage}
          className="rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60"
          disabled={inputDisabled || !input.trim()}
        >
          {isSending ? "Đang gửi" : "Gửi"}
        </button>
      </div>
    </div>
  );
}
