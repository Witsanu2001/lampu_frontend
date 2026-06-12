import { auth } from "../const/firebase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const apiUrl = import.meta.env.VITE_API_URL;

async function getFreshToken(): Promise<string> {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken(); 
  }
  return localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || "";
}

export async function postLineAuth(lineIdToken: string): Promise<Response> {

  const response = await fetch(`${apiUrl}/api/auth/line`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({ id_token: lineIdToken }),
  });
  
  return response;
}

export async function postUsersSync(updatedUser: any): Promise<Response> {
  const token = await getFreshToken();

  const syncResponse = await fetch(`${apiUrl}/api/users/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(updatedUser),
  });
  
  return syncResponse;
}