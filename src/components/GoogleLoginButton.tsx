//frontend/src/components/GoogleLoginButton.tsx

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function GoogleLoginButton() {
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const idToken = credentialResponse.credential;

      const res = await api.post("/auth/google", {
        idToken,
      });

      const { token } = res.data;

      await login(token);
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => {
        console.log("Google Login Failed");
      }}
    />
  );
}