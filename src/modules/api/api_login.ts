/* eslint-disable @typescript-eslint/no-explicit-any */
const apiUrl = import.meta.env.VITE_API_URL;

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

export async function postUsersSync(idToken: string, updatedUser: any): Promise<Response> {
  const syncResponse = await fetch(`${apiUrl}/api/users/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(updatedUser),
  });
  
  return syncResponse;
}