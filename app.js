import { Demand, STATE } from './demand.js'
import { Taxi } from './taxi.js'
import { getRandomPoint } from './util.js'
import { World } from './world.js'

const element = document.getElementById('world')
const world = new World(element)

world.addTaxi(new Taxi())
world.addTaxi(new Taxi())

function addRandomDemand(world) {
    const from = getRandomPoint(world.width, world.height)
    const to = getRandomPoint(world.width, world.height)

    const demand = new Demand(from, to)
    world.addDemand(demand)

    demand.watchable.onChange('state', (state) => {
        if (state === STATE.PICKED) {
            waitedUntilRide.push(Date.now() - demand.created)
            showStats()
        } else if (state === STATE.DROPPED) {
            waitedUntilArrive.push(Date.now() - demand.created)
            showStats()

            setTimeout(() => {
                addRandomDemand(world)
            }, 1000)
        }
    })

    return demand
}

const waitedUntilRide = []
const waitedUntilArrive = []

const waitedUntilArriveElement = document.getElementById('waitedUntilArrive')
const waitedUntilRideElement = document.getElementById('waitedUntilRide')

function showStats() {
    waitedUntilRideElement.innerText = waitedUntilRide.reduce((a, b) => a + b, 0) / waitedUntilRide.length / 1000
    waitedUntilArriveElement.innerText = waitedUntilArrive.reduce((a, b) => a + b, 0) / waitedUntilArrive.length / 1000
}

addEventListener('keydown', (e) => {
    if (e.key === 'r') {
        const demand = addRandomDemand(world)
    } else if (e.key === 't') world.addTaxi(new Taxi())
})

const addTaxiButton = document.getElementById('new_taxi')
addTaxiButton.addEventListener('click', () => {
    world.addTaxi(new Taxi())
})

const addDemandButton = document.getElementById('new_demand')
addDemandButton.addEventListener('click', () => {
    addRandomDemand(world)
})

