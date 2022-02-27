import { Config } from "../exportable/config";

export class KeyboardComponent {
    constructor() {
        this.render();
    }

    private render() {
        for (const keyRow of Config.KEYBOARD_LAYOUT) {
            const keyRowDiv = document.createElement("div");
            keyRowDiv.className = "keyboard-row";
            for (const keyValue of keyRow) {
                const keyDiv = document.createElement("div");
                const keyTextSpan = document.createElement("span");

                keyDiv.classList.add("keyboard-key");
                if (keyValue === "ENTER" || keyValue === "BACKSPACE") {
                    keyDiv.classList.add("large");
                    keyTextSpan.innerHTML = keyValue;

                    if (keyValue === "BACKSPACE") {
                        keyTextSpan.innerHTML = "←";
                    }
                } else {
                    keyTextSpan.innerHTML = keyValue;
                }
                keyDiv.appendChild(keyTextSpan)
                keyDiv.dataset.keyValue = keyValue;

                keyRowDiv.appendChild(keyDiv);
            }

            document.getElementById("keyboard").appendChild(keyRowDiv);
        }
    }
}