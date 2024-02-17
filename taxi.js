import { Router } from './router.js'
import { getDistance, getRandomPoint } from './util.js'
import { Watchable } from './watchable.js'

export class Taxi {
    position
    router
    stop

    current = 0
    capacity = 4
    watchable = new Watchable(this)
    element = document.createElement('div')

    constructor() {
        this.element.classList.add('taxi')

        this.watchable.onChange('position', this.onPositionChange.bind(this))
        this.watchable.onChange('current', this.onCurrentChange.bind(this))

        this.position = getRandomPoint(600, 600)
        this.moveToTarget()
    }

    mount(world) {
        this.world = world
        this.draw()

        this.router = new Router(this)
        this.router.pubsub.sub('newRoute', (stops) => {
            this.stop = stops[0]
        })
    }

    draw() {
        this.world.element.append(this.element)
    }

    onPositionChange(position) {
        this.element.style.setProperty('left', position[0] + 'px')
        this.element.style.setProperty('top', position[1] + 'px')
    }

    onCurrentChange(current) {
        this.element.innerText = current
    }

    async moveToTarget() {
        setInterval(() => {
            if (!this.stop) return

            const target = this.stop.point
            const distance = getDistance(this.position, target)

            const dx = target[0] - this.position[0]
            const dy = target[1] - this.position[1]

            const speed = 2
            const angle = Math.atan2(dy, dx)

            const x = this.position[0] + Math.cos(angle) * speed
            const y = this.position[1] + Math.sin(angle) * speed

            this.position = [x, y]

            if (distance < 1) {
                this.position = target
                this.router.arrivedAtStop(this.stop)
            }
        }, 10)
    }

    select(demand) {
        this.router.select(demand)
    }

    isBusy() {
        return this.router.isBusy()
    }
}
