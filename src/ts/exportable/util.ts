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