import { Config } from "./config";
import { GameHandler } from "./game";
import { IndexComponent } from "./index";

export class InputHandler {
    constructor(public indexComponent: IndexComponent, public gameHandler: GameHandler) {
        document.querySelectorAll(".keyboard-key").forEach((element) => element.addEventListener("click", this.handleClickKey.bind(this)));
        document.addEventListener("keydown", this.handleKeyDown.bind(this), true);
    }

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

        if (event.defaultPrevented || !this.gameHandler.active) {
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
            // this.handleClickGuess(event);
            return;
        }

        if (this.gameHandler.currentTry >= Config.NUM_TRIES) {
            return;
        }

        const guessBuffer = this.gameHandler.guessBuffer;

        if (keyValue === "BACKSPACE") {
            if (guessBuffer[0].length === 0) {
                return;
            }

            this.indexComponent.renderTextForCubes(undefined, this.gameHandler.currentTry, guessBuffer[0].length - 1);

            for (const words of this.gameHandler.guessBuffer) {
                words.pop();
            }

            return;
        }

        if (guessBuffer[0].length === Config.NUM_LETTERS) {
            return;
        }

        this.indexComponent.renderTextForCubes(keyValue, this.gameHandler.currentTry, guessBuffer[0].length);

        for (const words of this.gameHandler.guessBuffer) {
            words.push(keyValue);
        }
    }
}