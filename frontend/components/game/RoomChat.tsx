"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { UserCircle2 } from "lucide-react";
import { ChatMessage } from "@/types";

type RoomChatProps = {
  socket: Socket | null;
  roomId: string;
  currentUserId: string;
};

export function RoomChat({ socket, roomId, currentUserId }: RoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!socket || !roomId) {
      return;
    }

    const handleChatHistory = ({
      roomId: incomingRoomId,
      messages: incomingMessages,
    }: {
      roomId: string;
      messages: ChatMessage[];
    }) => {
      if (incomingRoomId !== roomId) {
        return;
      }
      setMessages(incomingMessages);
    };

    const handleChatMessage = ({
      roomId: incomingRoomId,
      message,
    }: {
      roomId: string;
      message: ChatMessage;
    }) => {
      if (incomingRoomId !== roomId) {
        return;
      }

      setMessages((prev) => [...prev, message]);
    };

    const handleChatError = ({
      roomId: incomingRoomId,
      error: incomingError,
    }: {
      roomId: string;
      error: string;
    }) => {
      if (incomingRoomId !== roomId) {
        return;
      }
      setError(incomingError);
    };

    socket.on("chatHistory", handleChatHistory);
    socket.on("chatMessage", handleChatMessage);
    socket.on("chatError", handleChatError);
    socket.emit("getChatHistory", { roomId });

    return () => {
      socket.off("chatHistory", handleChatHistory);
      socket.off("chatMessage", handleChatMessage);
      socket.off("chatError", handleChatError);
    };
  }, [socket, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSend = useMemo(() => input.trim().length > 0 && !!roomId, [input, roomId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!socket || !canSend) {
      return;
    }

    socket.emit("sendChatMessage", { roomId, message: input });
    setInput("");
    setError(null);
  };

  return (
    <section className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg backdrop-blur-sm">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Chat de sala</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {messages.length} mensajes
        </span>
      </header>

      <div className="h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80 p-3">
        <div className="space-y-3">
          {messages.map((chatMessage) => {
            const isMine = chatMessage.senderId === currentUserId;
            return (
              <article
                key={chatMessage.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm ${
                    isMine
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
                      : "border-cyan-500/30 bg-cyan-500/15 text-cyan-100"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                    <UserCircle2 className="h-4 w-4" />
                    <span>{chatMessage.senderNickname || "Usuario"}</span>
                  </div>
                  <p className="break-words leading-relaxed">{chatMessage.message}</p>
                </div>
              </article>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <p className="mt-2 rounded-md border border-rose-500/40 bg-rose-500/15 px-2 py-1 text-xs text-rose-200">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          maxLength={250}
        />
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
