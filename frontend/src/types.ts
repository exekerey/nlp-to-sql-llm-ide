export type DbType = 'postgresql' | 'mysql' | 'sqlite';

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

export interface DatabaseConfig {
    type: DbType;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    sqlitePath?: string;
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
