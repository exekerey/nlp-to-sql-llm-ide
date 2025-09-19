// src/lib/api.ts
export type Engine = 'postgres' | 'mysql' | 'clickhouse' | 'plsql';

export interface InitPayload {
    engine: Engine;
    host: string;
    port?: number;
    database: string;
    username: string;
    password?: string;
    ssl?: boolean;
}

export interface InitResponse {
    thread_id: string;
    schema: string; // plain text
}

export interface ChatSendBody {
    role: 'user';
    content: string;
    // поддержка новых полей, но мы их НЕ отправляем из чат-инпута
    sql_query?: string | null;
    query_results?: any[] | null;
}

export interface ChatMessageFromServer {
    role: 'assistant' | 'user';
    content: string;
    sql_query?: string | null;
    rows?: any[] | null; // сервер может прислать rows или query_results
    query_results?: any[] | null;
}

export interface ChatResponse {
    chat_id: string;
    data: ChatMessageFromServer[];
}

export interface ExecuteSqlResponse {
    query_results: any[];
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/v1';

export async function testConnection(
    signal?: AbortSignal
): Promise<{ status: string; message: string }> {
    const url = new URL(`${BASE_URL}/conversation/init`);
    url.searchParams.set('use_test_db', 'true');

    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal,
        credentials: 'include'
    });

    if (!res.ok) {
        try {
            const j = await res.json();
            const msg =
                (j?.detail && (typeof j.detail === 'string' ? j.detail : j.detail.error)) ||
                'Connection test failed';
            throw new Error(msg);
        } catch {
            throw new Error('Connection test failed');
        }
    }

    return res.json();
}
export async function initConversation(payload: InitPayload, signal?: AbortSignal): Promise<InitResponse> {
    const res = await fetch(`${BASE_URL}/conversation/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
        credentials: 'include'
    });
    if (!res.ok) {
        let msg = 'Init failed';
        try {
            const j = await res.json();
            msg = j?.detail?.error ?? JSON.stringify(j);
        } catch {}
        throw new Error(msg);
    }
    return res.json();
}

export async function sendChatMessage(threadId: string, content: string, signal?: AbortSignal): Promise<ChatResponse> {
    const body: ChatSendBody = { role: 'user', content };
    const res = await fetch(`${BASE_URL}/conversation/${encodeURIComponent(threadId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
        credentials: 'include'
    });
    if (!res.ok) {
        let msg = 'Chat request failed';
        try {
            const j = await res.json();
            msg = j?.detail ?? JSON.stringify(j);
        } catch {}
        throw new Error(typeof msg === 'string' ? msg : 'Chat request failed');
    }
    return res.json();
}

export async function executeSql(threadId: string, sql: string, signal?: AbortSignal): Promise<ExecuteSqlResponse> {
    const res = await fetch(`${BASE_URL}/conversation/${encodeURIComponent(threadId)}/sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
        signal,
        credentials: 'include'
    });
    if (!res.ok) {
        let msg = 'SQL execution failed';
        try {
            const j = await res.json();
            msg = j?.detail ?? JSON.stringify(j);
        } catch {}
        throw new Error(typeof msg === 'string' ? msg : 'SQL execution failed');
    }
    return res.json();
}
