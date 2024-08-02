import { Demand, STATE } from './demand.js'
import { Taxi } from './taxi.js'
import { getDistance, getRandomPoint } from './util.js'
import { World } from './world.js'

const waitedUntilArriveElement = document.getElementById('waitedUntilArrive')
const waitedUntilRideElement = document.getElementById('waitedUntilRide')
const velocityElement = document.getElementById('velocity')

let waitedUntilRide = []
let waitedUntilArrive = []
let velocities = []

const element = document.getElementById('world')
const world = new World(element)

const showStats = () => {
    waitedUntilRideElement.innerText =
        waitedUntilRide.slice(-50).reduce((a, b) => a + b, 0) /
        waitedUntilRide.length /
        1000
    waitedUntilArriveElement.innerText =
        waitedUntilArrive.slice(-50).reduce((a, b) => a + b, 0) /
        waitedUntilArrive.length /
        1000
    velocityElement.innerText =
        velocities.slice(-50).reduce((a, b) => a + b, 0) / velocities.length
}

const addRandomDemand = async (world) => {
    const from = getRandomPoint(world.width, world.height)
    const to = getRandomPoint(world.width, world.height)

    const distance = getDistance(from, to)
    const demand = new Demand(from, to)

    while (true) {
        try {
            world.addDemand(demand)
            break
        } catch (e) {
            console.log('배차 가능한 차량 없음, 계속 탐색중 ..')
            await new Promise((ok) => setTimeout(() => ok(), 1000))
        }
    }

    let pickedAt

    demand.watchable.onChange('state', (state) => {
        if (state === STATE.PICKED) {
            waitedUntilRide.push(Date.now() - demand.created)
            pickedAt = Date.now()
            showStats()
        } else if (state === STATE.DROPPED) {
            waitedUntilArrive.push(Date.now() - demand.created)

            const velocity = (Date.now() - pickedAt) / distance
            velocities.push(velocity)

            showStats()

            setTimeout(() => {
                addRandomDemand(world)
            }, 100)
        }
    })

    return demand
}

for (let i = 0; i < 5; i++) {
    await new Promise((ok) => setTimeout(() => ok(), 100))
    world.addTaxi(new Taxi())
}

for (let i = 0; i < 30; i++) {
    await new Promise((ok) => setTimeout(() => ok(), 100))
    addRandomDemand(world)
}

addEventListener('keydown', (e) => {
    if (e.key === 'd') {
        addRandomDemand(world)
    } else if (e.key === 't') {
        world.addTaxi(new Taxi())
    }
})

const addTaxiButton = document.getElementById('new_taxi')
addTaxiButton.addEventListener('click', () => {
    world.addTaxi(new Taxi())
})

const addDemandButton = document.getElementById('new_demand')
addDemandButton.addEventListener('click', () => {
    addRandomDemand(world)
})
