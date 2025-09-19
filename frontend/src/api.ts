import axios from 'axios';
import type { DatabaseConfig, QueryResult, TableSchema, DbType } from './types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiConnect(cfg: DatabaseConfig) {
    const { data } = await axios.post(`${API_URL}/connect`, cfg);
    return data as { connectionId: string };
}

export async function apiDisconnect(connectionId: string) {
    await axios.post(`${API_URL}/disconnect`, { connectionId });
}

export async function apiIntrospect(connectionId: string) {
    const { data } = await axios.post(`${API_URL}/introspect`, { connectionId });
    return data as TableSchema[];
}

export async function apiQuery(
    connectionId: string,
    sql: string,
    page = 1,
    pageSize = 200,
    timeoutMs = 15000
) {
    const { data } = await axios.post(`${API_URL}/query`, {
        connectionId,
        sql,
        page,
        pageSize,
        timeoutMs,
    });
    return data as QueryResult;
}

export async function apiGenerate(question: string, schema: TableSchema[], dbType: DbType) {
    const { data } = await axios.post(`${API_URL}/generate`, {
        question,
        schema,
        dbType,
    });
    return data as { sql: string; message?: string };
}
