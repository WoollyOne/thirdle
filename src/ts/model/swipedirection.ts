import { Config } from "../exportable/config";

export enum SwipeDirection {
    Left = "left",
    Right = "right",
    Up = "up",
    Down = "down",
    None = "none", // For when a swipe is too small
}

export function getSwipeDirection(delta: [number, number]): SwipeDirection {
    const xDelta = delta[0];
    const yDelta = delta[1];

    if (Math.max(Math.abs(xDelta), Math.abs(yDelta)) < Config.SWIPE_DELTA_THRESHOLD) {
        return SwipeDirection.None;
    }

    if (Math.abs(xDelta) > Math.abs(yDelta)) {
        if (xDelta > 0) {
            return SwipeDirection.Right;
        }
        else {
            return SwipeDirection.Left;
        }
    } else {
        if (yDelta > 0) {
            return SwipeDirection.Down;
        }
        else {
            return SwipeDirection.Up;
        }
    }
}