/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFreshToken } from "../../shared/infra/auth/token";

const apiUrl = import.meta.env.VITE_API_URL;

interface CheckPinPayload {
  project: string;
  PIN: string;
}

export async function settingSysteme(project_name: string) {
  const token = await getFreshToken();
  const response = await fetch(
    `${apiUrl}/api/systems/systems?project=${project_name}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to add order");
  }

  return json;
}

export async function systemeAdd(payload: any) { // ใช้ any หรือ interface ที่ตรงกับ payload
  const token = await getFreshToken();
  const response = await fetch(`${apiUrl}/api/systems/systems_add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to add system settings");
  }

  return json;
}

export async function systemeCheckPIN(payload: CheckPinPayload) {
  const token = await getFreshToken();
  const response = await fetch(`${apiUrl}/api/systems/check_pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload), // ส่งเป็น JSON string
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to check PIN");
  }

  return json;
}


export async function systemeUpdatePIN(payload: { project: string, oldPIN: string, newPIN: string }) {
  const token = await getFreshToken();
  const response = await fetch(`${apiUrl}/api/systems/update_pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to update PIN");
  }
  return json;
}
