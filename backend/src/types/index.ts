export type Player = {
  id: string;
  nickname: string;
  isAlive: boolean;
  role: "impostor" | "crewmate" | "unassigned";
}

export type Room = {
  id: string;
  name: string;
  state: "lobby" | "in-game" | "finished";
  host: string;
  players: Player[];
  game: GameState | null;
  chat: ChatRoom | null;
  isPrivate: boolean;
  passwordHash?: string | null;
}

export type GameState = {
  phase: "voting" | "discussion" | "words" | "finished";
  word: string;
  category: string;
  turnOrder: string[];
  currentTurnIndex: number;
  impostorIds: string[];
  votes: Record<string, string>;
  eliminatedIds: string[];
  wordsSubmitted: Record<string, string[]>;
  currentTimer: ReturnType<typeof setInterval> | null;
  winner: "impostors" | "crewmates" | null;
}

export type ChatMessage = {
	id: string;
	senderId: string;
	senderNickname: string;
	message: string;
	createdAt: number;
}

export type ChatRoom = {
    messages: ChatMessage[];
}