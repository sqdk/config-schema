import { IConfigReader } from '../interfaces'

export class JsonReader implements IConfigReader {
    constructor(public data: any) {
    }

    async Read() : Promise<any> {
        return new Promise((resolve) => resolve(this.data))
    }
}