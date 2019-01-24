import { IConfigReader, ConfigMap } from './interfaces'

export class ValidatorOptions {
    constructor(public keysWithChangingValues: RegExp[] = []) {
    }
}

export type ValidationError = MissingValueError | ValueMismatchError

export class MissingValueError {
    constructor(public location: string) {
    }
}

export class ValueMismatchError {
    constructor(public location: string) {
    }
}

export class Validator {
    constructor(public currentEnvConfigReader: IConfigReader, public nextEnvConfigReader: IConfigReader, public validatorOptions: ValidatorOptions) {
    }

    async validate() {
        const currentEnvConfig = await this.currentEnvConfigReader.Read()
        const nextEnvConfig = await this.nextEnvConfigReader.Read()

        function isWhiteListed(regexes: RegExp[], fullKey: string) {
            return regexes.some((regex) => {
                return regex.test(fullKey)
            })
        }

        function* traverse(validatorOptions: ValidatorOptions, currentLocation: string[], currentEnvSubset: ConfigMap, nextEnvSubset: ConfigMap): any {
            // Check for missing keys
            const currentKeys = Object.keys(currentEnvSubset)
            const nextKeys = Object.keys(nextEnvSubset)

            const keysMissingFromNext = currentKeys.filter(key => nextKeys.indexOf(key) < 0)
            const keysMissingFromCurrent = nextKeys.filter(key => currentKeys.indexOf(key) < 0)
            for (let key of keysMissingFromNext) {
                const fullKey = currentLocation.length > 0 ? `${currentLocation.join('.')}.${key}` : `${key}`
                if (!isWhiteListed(validatorOptions.keysWithChangingValues, fullKey))
                    yield new MissingValueError(fullKey)
            }

            for (let key of keysMissingFromCurrent) {
                const fullKey = currentLocation.length > 0 ? `${currentLocation.join('.')}.${key}` : `${key}`
                if (!isWhiteListed(validatorOptions.keysWithChangingValues, fullKey))
                    yield new MissingValueError(fullKey)
            }

            for (let key of Object.keys(currentEnvSubset)) {
                const fullKey = currentLocation.length > 0 ? `${currentLocation.join('.')}.${key}` : `${key}`

                const whitelisted = validatorOptions.keysWithChangingValues.some((regex) => {
                    return regex.test(fullKey)
                })

                if (whitelisted)
                    continue

                const newCurrentSubset = currentEnvSubset[key]
                const newNextSubset = nextEnvSubset[key]
                const currentType = typeof newCurrentSubset
                const nextType = typeof newNextSubset

                // If type is not a map, we check for consistency
                if (!(typeof newCurrentSubset == "object" && typeof newNextSubset == "object")) {
                    // Check if value at key is the same in both environments unless whitelisted by validatorOptions
                    if (newCurrentSubset !== newNextSubset) {
                        yield new ValueMismatchError(fullKey)
                        continue
                    }

                    continue
                }

                yield *traverse(validatorOptions, [...currentLocation, key], <ConfigMap>newCurrentSubset, <ConfigMap>newNextSubset)
            }
        }

        const validationErrors = [];
        const generator = traverse(this.validatorOptions, [], currentEnvConfig, nextEnvConfig)
        while(true) {
            const next = generator.next()
            if (next.done)
                break

            validationErrors.push(next.value)
        }

        return validationErrors
    }
}