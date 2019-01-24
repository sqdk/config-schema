import { IConfigReader, IConfigValue, ConfigMap } from '../interfaces'
import * as rm from 'typed-rest-client/RestClient'
import * as url from 'url'
import { Base64 } from 'js-base64'

export class ConsulConfigValue implements IConfigValue {
    constructor(public name: string, public value: string) {
        this.value = Base64.decode(value)
    }

    getName() {
        return this.name
    }

    getValue() {
        return this.value
    }
}

export class ConsulKVObject {
    constructor(public Key: string, public Value: string, public LockIndex: Number, public Flags: Number, public CreateIndex: Number, public ModifyIndex: number) {
    }
}

export class ConsulReader implements IConfigReader {
    constructor(public baseKey: string, public host: string, public dc: string, httpClient?: rm.RestClient) {
        if (httpClient) {
            this.httpClient = httpClient
        } else {
            this.httpClient = new rm.RestClient('config-schema', url.resolve(host, "v1/kv"))
        }
    }

    httpClient: rm.RestClient;

    async Read() : Promise<ConfigMap> {
        const targetUrl = url.resolve(this.baseKey, `?recurse=true&dc=${this.dc}`)
        const maybeValues = await this.httpClient.get<ConsulKVObject[] | null>(targetUrl)

        if (maybeValues.statusCode !== 200)
            throw new Error(`Unable to fetch list of keys for url ${targetUrl}`)

        if (typeof maybeValues.result === null)
            throw new Error(`Empty response when fetching keys at baseKey: ${this.baseKey} targetUrl: ${targetUrl}`)

        const values =
            (<ConsulKVObject[]>maybeValues.result)
                .filter(
                    (result) => result.Value !== null)
                .map(
                    (result) => new ConsulConfigValue(result.Key, result.Value))

        const map : ConfigMap = {}

        values.forEach((value) => {
            map[value.getName()] = value.getValue()
        })

        return map
    }
}