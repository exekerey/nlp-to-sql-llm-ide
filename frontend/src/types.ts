export type DbType = 'postgres' | 'mysql' | 'clickhouse' | 'plsql';

export interface DatabaseConfig {
    engine?: DbType;
    type?: DbType;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
}

export interface TableSchema {
    name: string;
    columns: {
        name: string;
        type: string;
        nullable: boolean;
        primaryKey: boolean;
        foreignKey?: string;
    }[];
}

export type SchemaPayload = TableSchema[] | string;

export interface QueryResult {
    columns: string[];
    rows: any[][];
    rowCount: number;
    executionTime: number;
}

export interface ChatMessage {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    sql?: string;
    timestamp: Date | string;
}
