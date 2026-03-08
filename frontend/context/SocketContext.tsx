"use client"

import {createContext, useContext, useEffect, useState} from "react"
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({ children } : { children: React.ReactNode }) {
    const [socket] = useState(() => io(process.env.NEXT_PUBLIC_BACKEND_URL!))

    useEffect(() => {
        return () => {
            socket.disconnect()
        }
    }, [])

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)