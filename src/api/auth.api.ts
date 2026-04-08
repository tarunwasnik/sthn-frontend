//fronted/src/api/auth.api.ts

import api from "./axios";

export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
  role: "user" | "creator";
}) => {
  return api.post("/auth/register", data);
};

export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const res = await api.post("/auth/login", data);
  return res.data;   // 👈 unwrap your standard response envelope
};
