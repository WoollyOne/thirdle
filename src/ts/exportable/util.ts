import { Config } from "./config";

export function incrementSetIfNotPresent(map: Map<string, number>, key: string) {
    if (map.has(key)) {
        map.set(key, map.get(key) + 1);
    } else {
        map.set(key, 1);
    }
}

export function decrementDeleteIfZero(map: Map<string, number>, key: string) {
    if (map.has(key)) {
        map.set(key, map.get(key) - 1);
    }

    if (map.get(key) === 0) {
        map.delete(key);
    }
}

export function getWidth(dimension: "x" | "y" | "z"): number {
    const { numLetters, numTries, dimensions, offset } = { numLetters: Config.NUM_LETTERS, numTries: Config.NUM_TRIES, dimensions: Config.CUBE_SIZE, offset: Config.CUBE_OFFSET };
    switch (dimension) {
        case "x":
            return (numLetters * dimensions) + ((numLetters - 1) * offset)
        case "y":
            return (numTries * dimensions) + ((numTries - 1) * offset);
        case "z":
            return getWidth("x");
    }
}

export function normalizeInBounds(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
}

export function getRotationFromPoint(x: number, y: number): number {
    let angle = Math.asin(x / Config.CAMERA_Z_DEFAULT);
    if (Math.acos(y / Config.CAMERA_Z_DEFAULT) <= 0) {
        angle = (2 * Math.PI) - angle;
    }

    return angle;
}

export function convertIndexWithSequentialOrdering(index: number) {
    const normalized = index % (4 * (Config.NUM_LETTERS - 1))

    // S side (0,1,2,3,4)
    if (normalized >= 0 && normalized < Config.NUM_LETTERS) {
        // 0
        // 1
        // 2
        // 3
        // 4
        return index;
    }

    // E side (6,8,10)
    if (normalized >= Config.NUM_LETTERS && normalized < (Config.NUM_LETTERS * 2) - 2) {
        // 5 -> 6
        // 6 -> 8
        // 7 -> 10

        return (2 * normalized) - (Config.NUM_LETTERS - 1);
    }

    // N side (15, 14, 13, 12, 11)
    if (normalized >= (Config.NUM_LETTERS * 2) - 2 && normalized < (Config.NUM_LETTERS * 3) - 2) {
        // 8 -> 15
        // 9 -> 14
        // 10 -> 13
        // 11 -> 12
        // 12 -> 11
        return ((4 * Config.NUM_LETTERS) - normalized) + 3;
    }

    // W side (9, 7, 5)
    if (normalized >= (Config.NUM_LETTERS * 3) - 2) {
        // 13 -> 9
        // 14 -> 7
        // 15 -> 5
        const decrementedNormalized = (7 * (Config.NUM_LETTERS)) - (2 * normalized);
        // 16 - 8 = 8, 16 - 14 = 2, 

        return decrementedNormalized;
    }
}