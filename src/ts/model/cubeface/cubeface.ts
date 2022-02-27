import { Vector3 } from "three";

export enum CubeFace {
    North,
    South,
    East,
    West,
}

export function getAsOffset(face: CubeFace): Vector3 {
    switch (face) {
        case CubeFace.North: {
            return new Vector3(0, 0, -1);
        }
        case CubeFace.South: {
            return new Vector3(0, 0, 1);
        }
        case CubeFace.East: {
            return new Vector3(1, 0, 0);
        }
        case CubeFace.West: {
            return new Vector3(-1, 0, 0);
        }
    }
}

export function getAsRotation(face: CubeFace): number {
    switch (face) {
        case CubeFace.North: {
            return Math.PI;
        }
        case CubeFace.South: {
            return 0;
        }
        case CubeFace.East: {
            return Math.PI / 2;
        }
        case CubeFace.West: {
            return (3 * Math.PI) / 2;
        }
    }
}