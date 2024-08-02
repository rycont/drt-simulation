import { Watchable } from './watchable.js'

export const STATE = {
    IDLE: 'idle',
    SELECTED: 'selected',
    PICKED: 'picked',
    DROPPED: 'dropped',
}

export class Demand {
    watchable = new Watchable(this)
    state = STATE.IDLE
    fromElement = document.createElement('div')
    toElement = document.createElement('div')
    created = Date.now()
    from
    to

    constructor(from, to) {
        this.watchable.onChange('state', this.onStateChange.bind(this))
        this.watchable.onChange('from', this.onFromChange.bind(this))
        this.watchable.onChange('to', this.onToChange.bind(this))

        this.from = from
        this.to = to

        this.fromElement.classList.add('demand', 'from', 'inactive')
        this.toElement.classList.add('demand', 'to', 'inactive')
    }

    onStateChange(state) {
        if (state === STATE.SELECTED) {
            this.fromElement.classList.remove('inactive')
            this.fromElement.classList.add('active')
        } else if (state === STATE.PICKED) {
            this.fromElement.classList.remove('active')
            this.fromElement.remove()

            this.toElement.classList.remove('inactive')
            this.toElement.classList.add('active')
        } else if (state === STATE.DROPPED) {
            this.toElement.remove()
            // this.fromElement.remove()
        }
    }

    mount(world) {
        this.world = world

        world.element.append(this.fromElement)
        world.element.append(this.toElement)

        this.grow()
    }

    onFromChange(from) {
        this.fromElement.style.setProperty('left', from[0] + 'px')
        this.fromElement.style.setProperty('top', from[1] + 'px')
    }

    onToChange(to) {
        this.toElement.style.setProperty('left', to[0] + 'px')
        this.toElement.style.setProperty('top', to[1] + 'px')
    }

    selectedBy(taxi) {
        if (this.state !== STATE.IDLE) throw new Error('Demand already picked')

        this.state = STATE.SELECTED
        this.taxi = taxi
    }

    clone() {
        return new Demand(this.from, this.to)
    }

    grow() {
        let size = 10
        let growingTarget = this.fromElement

        const growingInterval = setInterval(() => {
            size += 1

            growingTarget.style.setProperty('width', size + 'px')
            growingTarget.style.setProperty('height', size + 'px')
        }, 1000)

        this.watchable.onChange('state', (state) => {
            if (state === STATE.DROPPED) {
                clearInterval(growingInterval)
            } else if (state === STATE.PICKED) {
                growingTarget = this.toElement
                size = 10
            }
        })
    }
}
