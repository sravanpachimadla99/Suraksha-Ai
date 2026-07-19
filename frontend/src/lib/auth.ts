import { BACKEND_URL } from "./api";

const API_BASE = `${BACKEND_URL}/api/v1`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("suraksha_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Parse backend error detail gracefully, even if response is not JSON */
async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.detail || body?.message || fallback;
  } catch {
    return `${fallback} (${res.status} ${res.statusText})`;
  }
}

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Make sure the backend is running."
    );
  }

  if (!res.ok) {
    const msg = await parseError(res, "Registration failed");
    throw new Error(msg);
  }
  return res.json();
}

export async function loginUser(email: string, password: string) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Make sure the backend is running on http://localhost:8000"
    );
  }

  if (!res.ok) {
    const msg = await parseError(res, "Login failed");
    throw new Error(msg);
  }
  return res.json();
}

export async function getUserProfile() {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Cannot reach the server.");
  }
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function getUserActivity() {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/activity`, {
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Cannot reach the server.");
  }
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export function logoutUser() {
  localStorage.removeItem("suraksha_token");
  localStorage.removeItem("suraksha_user");
}
