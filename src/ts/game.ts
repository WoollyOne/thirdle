import { Config } from "./config";
import { IndexComponent } from "./index";

export class GameHandler {
    public currentTry: number = 0;
    public active: boolean = true;

    public words: string[][] = [];
    public guessBuffer: string[][] = [];

    constructor(public indexComponent: IndexComponent) {
        for (let i = 0; i < Config.NUM_WORDS; i++) {
            this.guessBuffer.push([]);
        }
    }
}