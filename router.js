import { STATE } from './demand.js'
import { Taxi } from './taxi.js'
import { getDistance } from './util.js'
import { PubSub, Watchable } from './watchable.js'

export class Router {
    pubsub = new PubSub()
    drawer = new RouterRenderer(this)
    watchable = new Watchable(this)

    demands = []
    route = []

    static BEAM = 5

    taxi

    constructor(taxi) {
        this.taxi = taxi

        this.watchable.onChange('route', this.onRouteChange.bind(this))
    }

    getExtendedLengthWithNewDemand(demand) {
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
                seatDelta: 1,
                next: {
                    point: demand.to,
                    sheetDelta: -1,
                    demand,
                },
                demand,
            }))

        const dropStops = demands
            .filter((demand) => demand.state === STATE.PICKED)
            .map((demand) => ({
                point: demand.to,
                demand,
            }))

        const allStops = [...pickStops, ...dropStops]

        // const allStops = [...pickStops]

        const { route } = beamSearch(
            Router.BEAM,
            this.taxi.position,
            allStops,
            Taxi.CAPACITY - this.taxi.current
        )

        return route
    }

    select(demand) {
        demand.selectedBy(this.taxi)

        if (this.route.length) {
            const nearPointFromPickingPoint = this.route
                .map((stop) => ({
                    stop,
                    distance: getDistance(stop.point, demand.from),
                }))
                .toSorted((a, b) => a.distance - b.distance)[0]

            if (
                nearPointFromPickingPoint &&
                nearPointFromPickingPoint.distance < 80
            ) {
                demand.from = [...nearPointFromPickingPoint.stop.point]
            }

            const nearPointFromDropPoint = this.route
                .map((stop) => ({
                    stop,
                    distance: getDistance(stop.point, demand.to),
                }))
                .toSorted((a, b) => a.distance - b.distance)[0]

            if (
                nearPointFromDropPoint &&
                nearPointFromDropPoint.distance < 80
            ) {
                demand.to = [...nearPointFromDropPoint.stop.point]
            }
        }

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

        return this.taxi.current + deltaAfterRoute >= Taxi.CAPACITY
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

function beamSearch(beamSize, currentPoint, stopPoints, leftSeats) {
    if (beamSize === 0 || stopPoints.length === 0) {
        return {
            travelLength: 0,
            route: [],
        }
    }

    const travelPathByNextPoint = stopPoints.map((candidate) => {
        const distanceFromCurrentPoint = getDistance(
            candidate.point,
            currentPoint
        )

        let nextLeftPoints = stopPoints.filter((point) => point !== candidate)

        if (candidate.next) {
            nextLeftPoints = [...nextLeftPoints, candidate.next]
        }

        const nextLeftSheets = leftSeats - candidate.seatDelta

        const leftMinimumTravelPath = beamSearch(
            beamSize - 1,
            candidate.point,
            [...nextLeftPoints],
            nextLeftSheets
        )

        const travelPathByCurrentPoint = {
            travelLength:
                distanceFromCurrentPoint + leftMinimumTravelPath.travelLength,
            route: [candidate, ...leftMinimumTravelPath.route],
        }

        return travelPathByCurrentPoint
    })

    const minimumTravelPath = travelPathByNextPoint.toSorted(
        (a, b) => a.travelLength - b.travelLength
    )[0]

    return minimumTravelPath
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

        this.drawLine(this.router.taxi.position, route[0])
        for (let i = 0; i < route.length - 1; i++) {
            this.drawLine(route[i], route[i + 1])
        }
    }

    drawLine(from, to) {
        const line = document.createElement('div')

        line.classList.add('line')
        line.style.setProperty('left', from[0] + 'px')
        line.style.setProperty('top', from[1] + 'px')

        const color = this.router.taxi.color
        if (color) {
            line.style.setProperty('border-color', color)
        }

        const angle = Math.atan2(to[1] - from[1], to[0] - from[0])
        const distance = getDistance(from, to)

        line.style.setProperty('width', distance + 'px')
        line.style.setProperty('transform', `rotate(${angle}rad)`)

        this.router.taxi.world.element.append(line)
        this.lines.push(line)
    }
}
