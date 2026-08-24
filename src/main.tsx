// frontend/src/main.tsx

import "./index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { MessagingProvider } from "./context/MessagingContext";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <BrowserRouter>
      <AuthProvider>
        <MessagingProvider>
          <App />
        </MessagingProvider>
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
