import { getFreshToken } from "../../shared/infra/auth/token";

const apiUrl = import.meta.env.VITE_API_URL;

export async function getRiders() {
  const token = await getFreshToken();
  const response = await fetch(`${apiUrl}/api/users/get_rider`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to fetch riders");
  return json.data; // คาดว่า data จะเป็น array ของ rider
}


export async function getAllUser() {
  const token = await getFreshToken();
  const response = await fetch(`${apiUrl}/api/users/all`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to fetch riders");
  return json.data; // คาดว่า data จะเป็น array ของ rider
}
