import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;

  getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: false, // We connect manually when entering a room
        transports: ["websocket"],
      });

      this.socket.on("connect", () => {
        console.log("🔌 Connected to Socket.io server");
      });

      this.socket.on("disconnect", (reason) => {
        console.log("🔌 Disconnected:", reason);
      });

      this.socket.on("connect_error", (error) => {
        console.error("🔌 Connection Error:", error);
      });
    }
    return this.socket;
  }

  connect() {
    const socket = this.getSocket();
    if (socket.disconnected) {
      socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const socketService = new SocketService();
