export class ResourceMap<K> {
    private readonly storage: Map<keyof K, number> = new Map()

    constructor(initialValues?: { [P in keyof Partial<K>]: number }) {
        if (initialValues) {
            for (const key in initialValues) {
                this.storage.set(key, initialValues[key])
            }
        }
    }

    Get(key: keyof K): number {
        if (!this.storage.has(key)) this.Set(key, 0)
        return this.storage.get(key)
    }
    Set(key: keyof K, value: number) {
        this.storage.set(key, value)
    }
    Add(key: keyof K, value: number) {
        if (!this.storage.has(key)) this.storage.set(key, 0)
        this.storage.set(key, this.storage.get(key) + value)
    }
    Subtract(key: keyof K, value: number) {
        if (!this.storage.has(key)) this.storage.set(key, 0)
        this.storage.set(key, this.storage.get(key) - Math.abs(value))
    }
    Entries() {
        return this.storage.entries()
    }
    Pick(...keys: (keyof K)[]): { [P in keyof K]: number } {
        const results: { [P in keyof K]: number } = {} as any
        for (const key of keys) {
            results[key] = this.Get(key)
        }
        return results
    }
    ToObject(): { [P in keyof K]: number } {
        const result = {} as any
        for (const [k, v] of this.storage.entries()) {
            result[k] = v
        }
        return result
    }
    Consume(object: { [P in keyof K]: number }) {
        this.storage.clear()
        for (const key in object) {
            this.Set(key, object[key])
        }
    }
    SumAllValues() {
        return [...this.storage.values()].reduce((p, c) => p + c, 0)
    }
}