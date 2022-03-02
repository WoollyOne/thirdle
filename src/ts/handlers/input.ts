import { Config } from "../exportable/config";
import { IndexComponent } from "../index";
import { getSwipeDirection, SwipeDirection } from "../model/swipedirection";
import { Renderer } from "../render/renderer";
import { GameHandler } from "./game";

export class InputHandler {
    constructor(public indexComponent: IndexComponent, public gameHandler: GameHandler, public renderer: Renderer) {
        document.querySelectorAll(".keyboard-key").forEach((element) => element.addEventListener("click", this.handleClickKey.bind(this)));
        document.addEventListener("keydown", this.handleKeyDown.bind(this), true);
        document.addEventListener("pointerdown", this.handlePointerDown.bind(this), true);
        document.addEventListener("pointerup", this.handlePointerUp.bind(this), true);
        document.addEventListener("pointermove", this.handlePointerMove.bind(this), true);
    }

    public dragLocation: [number, number] | null;

    handleKeyDown(event: KeyboardEvent) {
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }

        const element: HTMLElement = document.querySelector(`.keyboard-key[data-key-value="${event.key.toUpperCase()}"`);

        if (element) {
            element.click();
        }

        // Cancel the default action to avoid it being handled twice
        event.preventDefault();
    }

    handleClickKey(event: Event) {
        // this.soundPlayer.playSound('click');

        if (event.defaultPrevented || !this.gameHandler.active || this.renderer.currentAnimations.size !== 0) {
            return;
        }

        event.preventDefault();

        if (!(event.target instanceof HTMLElement)) {
            return;
        }

        const keyValue = event.target.dataset.keyValue;

        if (!keyValue) {
            throw new Error("Received undefined keyvalue");
        }

        if (keyValue === "ENTER") {
            this.gameHandler.guess();
            return;
        }

        if (this.gameHandler.currentTry >= Config.NUM_TRIES) {
            return;
        }

        const guessBuffer = this.gameHandler.guessBuffer;

        if (keyValue === "BACKSPACE") {
            console.log("back")
            if (guessBuffer[0].length === 0) {
                return;
            }

            this.renderer.renderTextForCubes(undefined, this.gameHandler.currentTry, guessBuffer[0].length - 1);

            for (const words of this.gameHandler.guessBuffer) {
                words.pop();
            }

            return;
        }

        if (guessBuffer[0].length === Config.NUM_LETTERS) {
            return;
        }

        this.renderer.renderTextForCubes(keyValue, this.gameHandler.currentTry, guessBuffer[0].length);

        for (const words of this.gameHandler.guessBuffer) {
            words.push(keyValue);
        }
    }

    handlePointerMove(event: MouseEvent) {
        if (!this.dragLocation) {
            return;
        }

        const delta: [number, number] = [event.clientX - this.dragLocation[0], event.clientY - this.dragLocation[1]];
        const swipeDirection = getSwipeDirection(delta, Config.SWIPE_DELTA_THRESHOLD);

        // Don't keep dragging if we are past the threshold
        if (swipeDirection !== SwipeDirection.None) {
            this.handlePointerUp(event);
            return;
        }

        this.renderer.dragMoveView(delta);
        event.preventDefault();
    }

    handlePointerDown(event: MouseEvent) {
        if (event.defaultPrevented) {
            return;
        }

        // Don't allow multiple taps/clicks
        if (this.dragLocation) {
            return;
        }

        event.preventDefault();
        this.dragLocation = [event.clientX, event.clientY];
    }

    handlePointerUp(event: MouseEvent) {
        if (event.defaultPrevented) {
            return;
        }

        // We need to have a click down first
        if (!this.dragLocation) {
            return;
        }

        const delta: [number, number] = [event.clientX - this.dragLocation[0], event.clientY - this.dragLocation[1]];

        const swipeDirection = getSwipeDirection(delta, Config.SWIPE_DELTA_THRESHOLD);

        // If there is no valid swipe, we have been dragging so we should drop.
        if (swipeDirection == SwipeDirection.None) {
            this.renderer.dragMoveViewDrop()
        } else {
            //  If the swipe is up, then we need to also move the camera back into the correct position
            if (swipeDirection === SwipeDirection.Up || swipeDirection === SwipeDirection.Down) {
                this.renderer.dragMoveViewDrop();
            }
            this.renderer.swipeMoveView(swipeDirection);
        }

        this.dragLocation = null;
    }
}