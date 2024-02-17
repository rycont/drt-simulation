import { Demand } from './demand.js'
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

    return demand
}

addEventListener('keydown', (e) => {
    if (e.key === 'r') addRandomDemand(world)
})

// for (let i = 0; i < 20; i++) {
//     addRandomDemand(world)
//     await new Promise((resolve) => setTimeout(resolve, 800))
// }
