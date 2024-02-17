export function getRandomPoint(x, y) {
    return [Math.floor(Math.random() * x), Math.floor(Math.random() * y)]
}

export function getDistance(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
}
