import { auth } from "../const/firebase";

const apiUrl = import.meta.env.VITE_API_URL;

async function getFreshToken(): Promise<string> {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("firebase_token") ||
    ""
  );
}

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
