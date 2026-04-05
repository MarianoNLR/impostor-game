"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNicknameState, useSocket } from "@/context/SocketContext";

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const socket = useSocket();
  const { hasNickname } = useNicknameState();

  useEffect(() => {
    if (!socket || !hasNickname) {
      router.replace("/");
    }
  }, [socket, hasNickname, router]);

  return children;
}
