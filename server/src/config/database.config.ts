export interface Db_config {
    host: string,
    protocol: string,
    port: number,
    name: string
}

export const db_config: Db_config = {
    host: '0.0.0.0',
    protocol: 'mongodb',
    port: 27017,
    name: 'checkers'
}