import { IConfigReader } from '../interfaces'

export class PassthroughReader implements IConfigReader {
    constructor(public data: Map<string, any>) {
    }

    async Read() : Promise<Map<string, any>> {
        return new Promise((resolve) => resolve(this.data))
    }
}