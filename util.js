const REGIONAL_RANDOM_SCALE = 0.1

function createRegionalRandomPointFunctions(blocks) {
    const regions = [...Array(blocks)].flatMap((_, i) =>
        [...Array(blocks)].map((_, j) => [i + 0.5, j + 0.5])
    )

    const regionalFunctions = regions.map(([i, j]) => (width, height) => {
        const regionCenterX = (width / blocks) * i
        const randomScaleX = (width / blocks) * REGIONAL_RANDOM_SCALE
        const x = regionCenterX + (Math.random() - 0.5) * randomScaleX

        const regionCenterY = (height / blocks) * j
        const randomScaleY = (height / blocks) * REGIONAL_RANDOM_SCALE
        const y = regionCenterY + (Math.random() - 0.5) * randomScaleY

        return [x, y]
    })

    return regionalFunctions
}

const randomPointFunctions = [
    function pureRandomPoint(width, height) {
        return [
            Math.floor(Math.random() * width),
            Math.floor(Math.random() * height),
        ]
    },
    ...createRegionalRandomPointFunctions(3),
]

export function getRandomPoint(x, y) {
    const pickedFunction =
        randomPointFunctions[
            Math.floor(Math.random() * randomPointFunctions.length)
        ]
    return pickedFunction(x, y)
}

export function getDistance(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
}
