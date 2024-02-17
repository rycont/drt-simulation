export class Watchable {
    handlers = {}
    

    constructor(target) {
        this.target = target
    }

    field(key) {
        let realValue = this.target[key]

        Object.defineProperty(this.target, key, {
            set: (value) => {
                const handlers = this.handlers[key]

                if (handlers) {
                    for (const handler of handlers) {
                        handler(value)
                    }
                }

                realValue = value
                return value
            },
            get: () => {
                return realValue
            }
        })
    }

    onChange(key, handler) {
        if(!this.handlers[key]) {
            this.handlers[key] = []
            this.field(key)
        }
        
        this.handlers[key] = [...(this.handlers[key]), handler]

        return () => {
            this.handlers = this.handlers.filter((h) => h !== handler)
        }
    }
}

export class PubSub {
    handlers = {}

    sub(event, listener) {
        if (!this.handlers[event]) this.handlers[event] = []
        this.handlers[event].push(listener)
    }

    pub(event, args) {
        if (!this.handlers[event]) return

        for (const listener of this.handlers[event]) {
            listener(...args)
        }
    }
}
