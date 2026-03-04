const API_BASE = "http://localhost:8000";

export async function fetchAPI(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });
}
