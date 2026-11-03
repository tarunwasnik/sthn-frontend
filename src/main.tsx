// frontend/src/main.tsx

import "./index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { MessagingProvider } from "./context/MessagingContext";
import { NotificationProvider } from "./context/NotificationContext";
import { BookingRequestsProvider } from "./context/BookingRequestsContext";
import { ThemeProvider } from "./theme/ThemeProvider";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <MessagingProvider>
            <NotificationProvider><BookingRequestsProvider><App /></BookingRequestsProvider></NotificationProvider>
          </MessagingProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </GoogleOAuthProvider>
);
