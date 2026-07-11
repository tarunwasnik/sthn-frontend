//frontend/src/components/IdentityRefreshListener.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { socket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

export default function IdentityRefreshListener() {
  const navigate = useNavigate();

  const { userId, bootstrap } = useAuth();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const handleIdentityChanged = async (payload: { userId: string }) => {
      console.log("IDENTITY CHANGED", payload);

      /*
       * Ignore events that belong to another user.
       * (Today the backend emits only to this user's sockets,
       * but this keeps the listener safe if the event strategy
       * ever changes.)
       */
      if (payload.userId !== userId) {
        return;
      }

      /*
       * Refresh authentication and ask the Entry Resolver
       * where this user now belongs.
       */
      const entry = await bootstrap();

      if (!entry) {
        return;
      }

      /*
       * Navigate to the new destination returned
       * by the backend.
       */
      navigate(entry.entryRoute, {
        replace: true,
      });
    };

    socket.on("identity:changed", handleIdentityChanged);

    return () => {
      socket.off("identity:changed", handleIdentityChanged);
    };
  }, [userId, bootstrap, navigate]);

  return null;
}
