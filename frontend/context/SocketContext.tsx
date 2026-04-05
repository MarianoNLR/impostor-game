"use client"

import {createContext, useContext, useEffect, useState} from "react"
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null)

type NicknameContextValue = {
    hasNickname: boolean;
    setHasNickname: (value: boolean) => void;
};
const NicknameContext = createContext<NicknameContextValue | null>(null)

export function SocketProvider({ children } : { children: React.ReactNode }) {
    const [socket] = useState(() => io(process.env.NEXT_PUBLIC_BACKEND_URL!))
    const [hasNickname, setHasNickname] = useState(false)

    useEffect(() => {
        const handleDisconnect = () => {
            setHasNickname(false)
        }

        socket.on("disconnect", handleDisconnect)

        return () => {
            socket.off("disconnect", handleDisconnect)
            socket.disconnect()
        }
    }, [])

    return (
        <SocketContext.Provider value={socket}>
            <NicknameContext.Provider value={{ hasNickname, setHasNickname }}>
                {children}
            </NicknameContext.Provider>
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)

export const useNicknameState = () => {
    const context = useContext(NicknameContext)
    if (!context) {
        throw new Error("useNicknameState must be used within SocketProvider")
    }
    return context
}