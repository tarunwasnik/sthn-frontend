// frontend/src/lib/socket.ts

import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL;

export const socket: Socket = io(
  SOCKET_URL,
  {
    withCredentials: true,
    transports: ["websocket"],
  }
);

socket.on("connect", () => {
  console.log(
    "SOCKET CONNECTED",
    socket.id
  );
});

socket.on("disconnect", () => {
  console.log(
    "SOCKET DISCONNECTED"
  );
});

socket.on("connect_error", (err) => {
  console.error(
    "SOCKET ERROR",
    err
  );
});