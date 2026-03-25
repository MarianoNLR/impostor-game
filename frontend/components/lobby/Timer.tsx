type TimerProps = {
  timeLeft: number
  duration: number
}

export function Timer({ timeLeft, duration = 30 }: TimerProps) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (timeLeft / duration) * circumference
  const color = timeLeft > duration * 0.5 
    ? "#22c55e" 
    : timeLeft > duration * 0.25 
      ? "#f59e0b" 
      : "#ef4444"

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: "stroke 0.3s ease" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-black">
          {timeLeft}
        </span>
      </div>
    </div>
  )
}