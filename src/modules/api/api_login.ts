/* eslint-disable @typescript-eslint/no-explicit-any */

import { getFreshToken } from "../../shared/infra/auth/token";

const apiUrl = import.meta.env.VITE_API_URL || "https://api-gateway-879165280409.asia-southeast1.run.app";

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

export async function postSyncUserToRTDB(uid: string): Promise<Response> {
  const token = await getFreshToken();

  const syncResponse = await fetch(`${apiUrl}/api/users/sync_to_live?user_id=${uid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  
  return syncResponse;
}