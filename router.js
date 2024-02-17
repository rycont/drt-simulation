import { STATE } from './demand.js'
import { getDistance } from './util.js'
import { PubSub, Watchable } from './watchable.js'

export class Router {
    pubsub = new PubSub()
    drawer = new RouterRenderer(this)
    watchable = new Watchable(this)

    demands = []
    route = []

    taxi

    constructor(taxi) {
        this.taxi = taxi

        this.watchable.onChange('route', this.onRouteChange.bind(this))
    }

    getExtendedPathWithNewDemand(demand) {
        if (this.demands.length === 0) return 1

        const demandsSnapshot = [...this.demands]

        const pathDistance = this.getPathDistanceFromStops(
            this.getProperPathFromDemands(demandsSnapshot)
        )

        const clonedDemand = demand.clone()
        clonedDemand.selectedBy(this.taxi)

        const pathDistanceWithNewDemand = this.getPathDistanceFromStops(
            this.getProperPathFromDemands([...demandsSnapshot, clonedDemand])
        )

        return pathDistanceWithNewDemand - pathDistance
    }

    getProperPathFromDemands(demands) {
        const taxiPoint = {
            point: this.taxi.position,
        }

        if (demands.length === 0) return [taxiPoint]

        const pickStops = demands
            .filter((demand) => demand.state === STATE.SELECTED)
            .map((demand) => ({
                point: demand.from,
                demand,
            }))

        const dropStops = demands
            .filter((demand) => demand.state === STATE.PICKED)
            .map((demand) => ({
                point: demand.to,
                demand,
            }))

        const allStops = [...pickStops, ...dropStops]

        const { route } = beamSearch(
            8,
            this.taxi.position,
            allStops,
            this.taxi.capacity - this.taxi.current
        )
        return route
    }

    select(demand) {
        demand.selectedBy(this.taxi)
        this.demands.push(demand)

        this.route = this.getProperPathFromDemands(this.demands)
    }

    getPathDistanceFromStops(stops) {
        const points = stops.map((stop) => stop.point)
        return points.reduce((distance, point, index) => {
            if (index === 0) return 0

            return distance + getDistance(points[index - 1], point)
        }, 0)
    }

    isBusy() {
        const deltaAfterRoute = this.route
            .map((stop) => {
                if (!stop.demand) {
                    return 0
                }

                if (stop.demand.state === STATE.SELECTED) {
                    return 1
                } else if (stop.demand.state === STATE.PICKED) {
                    return -1
                }
            })
            .reduce((a, b) => a + b, 0)

        return this.taxi.current + deltaAfterRoute >= this.taxi.capacity
    }

    arrivedAtStop(stop) {
        const onArrive = stop.demand?.onArrive
        if (onArrive) onArrive()

        const demand = stop.demand
        if (!demand) return

        if (demand.state === STATE.SELECTED) {
            demand.state = STATE.PICKED
            this.taxi.current++
        } else if (demand.state === STATE.PICKED) {
            demand.state = STATE.DROPPED
            this.demands = this.demands.filter((d) => d !== demand)
            this.taxi.current--
        }

        this.route = this.getProperPathFromDemands(this.demands)
    }

    onRouteChange(route) {
        this.pubsub.pub('newRoute', [route])
    }
}

function beamSearch(beam, from, stops, left) {
    const distancesByStops = stops
        .map((viaStop) => {
            const distance = getDistance(from, viaStop.point)

            if (beam === 0 || stops.length === 1) {
                return { distance, route: [viaStop] }
            }

            let availableStops = stops.filter((s) => s !== viaStop)

            if (left === 0) {
                availableStops = availableStops.filter((s) =>
                    s.demand ? s.demand.state === STATE.SELECTED : true
                )
            }

            let leftAfterStop = left

            if (viaStop.demand?.state === STATE.SELECTED) {
                availableStops.push({
                    point: viaStop.demand.to,
                })
                leftAfterStop = left - 1
            }

            if (viaStop.demand?.state === STATE.PICKED) {
                leftAfterStop = left + 1
            }

            try {
                const beamChildren = beamSearch(
                    beam - 1,
                    viaStop.point,
                    availableStops,
                    leftAfterStop
                )

                return {
                    distance: beamChildren.distance + distance,
                    route: [viaStop, ...beamChildren.route],
                }
            } catch (e) {
                return null
            }
        })
        .filter((r) => r)
        .sort((a, b) => a.distance - b.distance)

    const maxRouteLength = Math.max(
        ...distancesByStops.map((r) => r.route.length)
    )

    const maxRoutes = distancesByStops.filter(
        (r) => r.route.length === maxRouteLength
    )

    if (!maxRoutes[0]) {
        throw new Error('No available routes')
    }

    return maxRoutes[0]
}

class RouterRenderer {
    lines = []

    constructor(router) {
        this.router = router
        this.router.pubsub.sub('newRoute', this.newRoute.bind(this))
    }

    newRoute(stops) {
        this.lines.forEach((line) => line.remove())

        const route = stops.map((stop) => stop.point)

        for (let i = 0; i < route.length - 1; i++) {
            this.drawLine(route[i], route[i + 1])
        }
    }

    drawLine(from, to) {
        const line = document.createElement('div')

        line.classList.add('line')
        line.style.setProperty('left', from[0] + 'px')
        line.style.setProperty('top', from[1] + 'px')

        const angle = Math.atan2(to[1] - from[1], to[0] - from[0])
        const distance = getDistance(from, to)

        line.style.setProperty('width', distance + 'px')
        line.style.setProperty('transform', `rotate(${angle}rad)`)

        this.router.taxi.world.element.append(line)
        this.lines.push(line)
    }
}
