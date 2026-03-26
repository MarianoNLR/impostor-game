import { roomRepository } from "../repositories/roomRepository";
import { ChatMessage } from "../types";

const MAX_MESSAGES_PER_ROOM = 100;

export function getRoomChat(roomId: string): ChatMessage[] {
	const room = roomRepository.findById(roomId);
	return room?.chat?.messages ?? [];
}

export function clearRoomMessages(roomId: string): void {
	const room = roomRepository.findById(roomId);
	if (!room) return;
	if (!room.chat) {
		room.chat = { messages: [] };
	} else {
		room.chat.messages.length = 0;
	}
}

export function sendRoomMessage(
	roomId: string,
	senderId: string,
	senderNickname: string,
	rawMessage: string
): { ok: true; chatMessage: ChatMessage } | { ok: false; error: string } {
	const room = roomRepository.findById(roomId);
	if (!room) {
		return { ok: false, error: "Room does not exist." };
	}

	const senderExistsInRoom = room.players.some((player) => player.id === senderId);
	if (!senderExistsInRoom) {
		return { ok: false, error: "Sender does not belong to this room." };
	}

	const message = rawMessage?.trim();
	if (!message) {
		return { ok: false, error: "Message cannot be empty." };
	}

	const chatMessage: ChatMessage = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		senderId,
		senderNickname,
		message,
		createdAt: Date.now(),
	};

	if (!room.chat) {
		room.chat = { messages: [] };
	}

	room.chat.messages.push(chatMessage);

	if (room.chat.messages.length > MAX_MESSAGES_PER_ROOM) {
		room.chat.messages.splice(0, room.chat.messages.length - MAX_MESSAGES_PER_ROOM);
	}

	return { ok: true, chatMessage };
}
