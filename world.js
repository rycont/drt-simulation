import { PubSub } from './watchable.js'

export class World {
    pubsub = new PubSub()

    demands = []
    taxis = []

    width = 600
    height = 600

    constructor(element) {
        this.element = element
    }

    async addDemand(demand) {
        const notBusyTaxis = this.taxis.filter((taxi) => !taxi.isBusy())
        if (notBusyTaxis.length === 0) throw new Error('No available taxis')

        const receptivities = notBusyTaxis
            .map((taxi) => ({
                taxi,
                receptivity: taxi.router.getExtendedPathWithNewDemand(demand),
            }))
            .filter((r) => r.receptivity !== 0)
            .sort((a, b) => a.receptivity - b.receptivity)

        if (receptivities.length === 0) throw new Error('No available taxis')

        const { taxi } = receptivities[0]

        this.demands.push(demand)
        demand.mount(this)

        taxi.select(demand)
    }

    addTaxi(taxi) {
        this.taxis.push(taxi)
        taxi.mount(this)
    }
}
