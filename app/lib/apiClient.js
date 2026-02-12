import { API_URL } from "@/constants/api";
import { auth } from "@/lib/firebase";

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}
