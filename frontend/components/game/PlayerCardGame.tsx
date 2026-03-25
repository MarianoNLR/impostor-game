import { useSocket } from "@/context/SocketContext"
import { User, ThumbsDown } from "lucide-react"

type PlayerCardProps = {
  id: string
  nickname: string
  role?: "crewmate" | "impostor" | "unassigned"
  showRole?: boolean,
  phase?: "voting" | "discussion" | "words" | "finished",
  roomId: string,
  playerAlreadyVoted?: boolean,
  onVote?: (targetId: string) => void
  isAlive: boolean
}

export function PlayerCardGame(props : PlayerCardProps) {
  const socket = useSocket();
  const role = props.role ?? "unassigned"
  const isAlive = props.isAlive ? true : false

  const roleStyles = {
    crewmate: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    impostor: "text-red-400 bg-red-400/10 border-red-400/30",
    unassigned: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  }

  const roleLabel = {
    crewmate: "Crewmate",
    impostor: "Impostor",
    unassigned: "Waiting...",
  }

  const avatarStyles = {
    crewmate: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
    impostor: "bg-red-500/20 border-red-500/40 text-red-300",
    unassigned: "bg-slate-700/50 border-slate-600/40 text-slate-400",
  }

  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border w-28 backdrop-blur-sm transition-all
      ${isAlive 
        ? "bg-slate-800/60 border-slate-700/50" 
        : "bg-slate-900/40 border-slate-700/20 opacity-50 grayscale"
      }`}>
      <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center 
        ${isAlive ? avatarStyles[role] : "bg-slate-800/50 border-slate-600/20 text-slate-600"}`}>
        <User size={28} strokeWidth={1.5} />
      </div>
      <span className={`text-sm font-medium truncate w-full text-center
        ${isAlive ? "text-white" : "text-slate-600"}`}>
        {props.nickname}
      </span>
      {props.showRole && (
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
          ${isAlive ? roleStyles[role] : "text-slate-600 bg-slate-800/30 border-slate-700/20"}`}>
          {isAlive ? roleLabel[role] : "Eliminated"}
        </span>
      )}
      {props.phase === "voting" && isAlive && socket?.id !== props.id && !props.playerAlreadyVoted && (
        <button onClick={() => props.onVote?.(props.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">
          <ThumbsDown size={14} />
        </button>
      )}
    </div>
  )
}