import type { DatabaseConfig, TableSchema, SchemaPayload } from './types';

export const API_BASE =
    (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
    'http://localhost:8000/v1';

type InitResponse = {
    thread_id: string;
    schema: SchemaPayload;
};

function isCredsError(message: string) {
    const m = (message || '').toLowerCase();
    return /28p01|password authentication failed|invalid authorization|role .* does not exist|access denied|er_access_denied|authentication failed|wrong password|unknown user/i.test(
        m
    );
}

function normalizeCredentials(cfg: DatabaseConfig) {
    const uiEngine = (cfg as any).engine ?? (cfg as any).type;
    const engineMap: Record<string, string> = {
        postgres: 'postgres',
        postgresql: 'postgres',
        mysql: 'mysql',
        clickhouse: 'clickhouse',
        plsql: 'plsql',
    };
    const engine = engineMap[String(uiEngine).toLowerCase()] ?? uiEngine;

    if (!['postgres', 'mysql', 'clickhouse', 'plsql'].includes(String(engine))) {
        throw new Error(
            `Этот бэкенд не поддерживает "${uiEngine}". Доступно: postgres, mysql, clickhouse, plsql.`
        );
    }

    return {
        engine,
        host: cfg.host,
        port: Number(cfg.port),
        database: cfg.database,
        username: cfg.username,
        password: cfg.password,
        ssl: cfg.ssl ?? false,
    };
}

export async function apiInitConversation(
    credentials: DatabaseConfig
): Promise<InitResponse> {
    const body = JSON.stringify(normalizeCredentials(credentials));
    const r = await fetch(`${API_BASE}/conversation/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    });

    if (!r.ok) {
        let raw = '';
        try {
            const j = await r.json();
            raw = j?.detail?.error ?? j?.error ?? (typeof j === 'string' ? j : JSON.stringify(j));
        } catch {
            raw = await r.text();
        }
        if (isCredsError(raw)) {
            throw new Error('Неправильные креды: проверь логин/пароль, хост/порт и права доступа.');
        }
        throw new Error(raw || 'Init failed');
    }

    return r.json();
}

type ChatBody = {
    role: 'user';
    content: string;
    sql_query?: string | null;
    query_results?: any[] | null;
};

export async function apiChatOnce(
    threadId: string,
    content: string,
    opts?: { sqlQuery?: string | null; queryResults?: any[] | null }
): Promise<string> {
    const body: ChatBody = {
        role: 'user',
        content,
        sql_query: opts?.sqlQuery ?? null,
        query_results: opts?.queryResults ?? null,
    };

    const r = await fetch(`${API_BASE}/conversation/${encodeURIComponent(threadId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!r.ok) {
        let raw = '';
        try {
            const j = await r.json();
            raw =
                j?.detail?.error ??
                j?.error ??
                j?.detail ??
                (typeof j === 'string' ? j : JSON.stringify(j));
        } catch {
            raw = await r.text();
        }
        throw new Error(raw || 'Chat failed');
    }

    const data = await r.json();
    return (data?.data?.[0]?.content ?? '').toString();
}

/** ---- STREAM CHAT (NDJSON) ---- **/
export async function apiChatStream(
    threadId: string,
    content: string,
    args: {
        sqlQuery?: string | null;
        queryResults?: any[] | null;
        signal?: AbortSignal;
        onStart?: () => void;
        onToken: (chunk: string) => void;
        onInternal?: (info: string) => void;
        onEnd?: () => void;
    }
): Promise<void> {
    const url = `${API_BASE}/conversation/${encodeURIComponent(threadId)}?stream=true`;

    const body: ChatBody = {
        role: 'user',
        content,
        sql_query: args.sqlQuery ?? null,
        query_results: args.queryResults ?? null,
    };

    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: args.signal,
    });

    if (!r.ok || !r.body) {
        let raw = '';
        try {
            const j = await r.json();
            raw = j?.detail?.error ?? j?.error ?? j?.detail ?? (await r.text());
        } catch {
            raw = await r.text();
        }
        throw new Error(raw || 'Stream failed to start');
    }

    args.onStart?.();

    const reader = r.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let idx: number;
            while ((idx = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, idx).trim();
                buffer = buffer.slice(idx + 1);
                if (!line) continue;

                try {
                    const evt = JSON.parse(line);
                    switch (evt.event) {
                        case 'content':
                            if (evt.data) args.onToken(String(evt.data));
                            break;
                        case 'internal':
                            if (evt.data && args.onInternal) args.onInternal(String(evt.data));
                            break;
                        case 'error':
                            throw new Error((evt.data && String(evt.data)) || 'Stream error from server');
                    }
                } catch {
                }
            }
        }
    } finally {
        args.onEnd?.();
        try {
            reader.releaseLock();
        } catch {}
    }
}

export function extractSqlFromText(s: string): string | null {
    const fenced = /```sql\s*([\s\S]*?)```/i.exec(s);
    if (fenced?.[1]) return fenced[1].trim();
    const m = /\b(select|with|insert|update|delete)\b[\s\S]+$/i.exec(s);
    return m ? m[0].trim() : null;
}
