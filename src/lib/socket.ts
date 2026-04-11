// frontend/src/lib/socket.ts

import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL;

export const socket: Socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket"],
});