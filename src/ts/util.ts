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