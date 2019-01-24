export interface IConfigReader {
    Read(): Promise<ConfigMap>;
}

export interface IConfigValue {
    getName(): string
    getValue(): string
}

export type ConfigMap = { [key: string]: any }