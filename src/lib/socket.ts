// frontend/src/lib/socket.ts

import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL;

export const socket: Socket = io(
  SOCKET_URL,
  {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: false,
    reconnectionAttempts: 3,
  }
);

export const connectAuthenticatedSocket = (token: string): void => {
  if (socket.connected && socket.auth?.token === token) {
    return;
  }

  if (socket.connected) {
    socket.disconnect();
  }

  socket.auth = { token };
  socket.connect();
};

export const disconnectAuthenticatedSocket = (): void => {
  socket.auth = {};
  socket.disconnect();
};

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
