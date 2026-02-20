import { API_URL } from "@/constants/api";
import { auth } from "@/lib/firebase";

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  // Check if response is ok before returning
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If can't parse JSON, try to get text
      const text = await response.text();
      if (text && text.length < 200) {
        errorMessage = text;
      }
    }
    console.error(`API Error [${options.method || 'GET'}] ${url}:`, errorMessage);
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return response;
}
