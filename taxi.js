import { Router } from './router.js'
import { getDistance, getRandomPoint } from './util.js'
import { Watchable } from './watchable.js'

const TAXI_COLORS = ['#4A249D', '#009FBD', '#F9E2AF', '#FEAE6F']

export class Taxi {
    position
    router
    stop

    static CAPACITY = 5

    color = TAXI_COLORS.pop()
    current = 0
    watchable = new Watchable(this)
    element = document.createElement('div')

    constructor() {
        this.element.classList.add('taxi')
        this.element.style.setProperty('background-color', this.color)

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
        while (true) {
            await new Promise((ok) => setTimeout(() => ok(), 10))
            if (!this.stop) continue

            const target = this.stop.point
            const distance = getDistance(this.position, target)

            if (distance < 5) {
                const lastStop = this.stop

                this.position = this.stop.point
                this.router.arrivedAtStop(this.stop)

                await new Promise((ok) => setTimeout(() => ok(), 200))

                continue
            }

            const dx = target[0] - this.position[0]
            const dy = target[1] - this.position[1]

            const speed = 1
            const angle = Math.atan2(dy, dx)

            const x = this.position[0] + Math.cos(angle) * speed
            const y = this.position[1] + Math.sin(angle) * speed

            this.position = [x, y]
        }
    }

    select(demand) {
        this.router.select(demand)
    }

    isBusy() {
        return this.router.isBusy()
    }
}
