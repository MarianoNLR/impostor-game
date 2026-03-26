import { Server, Socket } from "socket.io"
import { getRoomChat, sendRoomMessage } from "./chatService";
import { roomRepository } from "../repositories/roomRepository";

const registerChatHandlers = (io: Server, socket: Socket) => {
	socket.on("getChatHistory", ({ roomId }: { roomId: string }) => {
		const room = roomRepository.findById(roomId);
		if (!room) {
			return socket.emit("chatError", { roomId, error: "Room does not exist." });
		}

		socket.emit("chatHistory", { roomId, messages: getRoomChat(roomId) });
	});

	socket.on("sendChatMessage", ({ roomId, message }: { roomId: string; message: string }) => {
		const senderNickname = socket.data.nickname ?? "Anonymous";
		const result = sendRoomMessage(roomId, socket.id, senderNickname, message);

		if (!result.ok) {
			return socket.emit("chatError", { roomId, error: result.error });
		}

		io.to(roomId).emit("chatMessage", { roomId, message: result.chatMessage });
	});
}

export default registerChatHandlers;