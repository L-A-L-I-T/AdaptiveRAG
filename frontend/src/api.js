const API_BASE = import.meta.env.VITE_API_URL || "";

function getSessionId() {
  const key = "adaptive_rag_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export async function sendQuery(query) {
  const response = await fetch(`${API_BASE}/rag/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      session_id: getSessionId(),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || `Query failed (${response.status})`);
  }

  return data.result?.content ?? "No response content.";
}

export async function uploadDocument(file, description) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/rag/documents/upload`, {
    method: "POST",
    headers: { "X-Description": description },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || `Upload failed (${response.status})`);
  }

  return data.status === true;
}

export function resetSession() {
  localStorage.removeItem("adaptive_rag_session_id");
}
