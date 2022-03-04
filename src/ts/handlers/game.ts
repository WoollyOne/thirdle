import { Config } from "../exportable/config";
import { Constants } from "../exportable/constants";
import { gameDict } from "../exportable/dicts/gamedict";
import { validDict } from "../exportable/dicts/validdict";
import { IndexComponent } from "../index";
import { CubeUpdateData } from "../model/cubeface/cubeupdatedata";
import { GuessResult, GuessResultType, LetterResultType } from "../model/guessresults";
import { Renderer } from "../render/renderer";

export class GameHandler {
    public currentTry: number = 0;
    public active: boolean = true;

    public words: string[][] = [];
    public guessBuffer: string[][] = [];
    public correctGuessIndices: Set<number> = new Set();

    constructor(public indexComponent: IndexComponent, public renderer: Renderer) {
        this.resetGuessBuffer();

        // Generate the game words
        const gameWords: string[] = [];

        while (gameWords.length < 4) {
            let nextWord: string;

            do { nextWord = this.getRandomWord(); }
            while (gameWords.includes(nextWord));

            gameWords.push(nextWord.toUpperCase());
        }

        this.words = gameWords.map((word) => word.split(""));
    }

    public guess() {
        // Too few letters
        if (this.guessBuffer[0].length < Config.NUM_LETTERS) {
            return;
        }

        const results: GuessResult[] = [];

        for (let i = 0; i < Constants.NUMBER_OF_WORDS; i++) {
            const guess = this.guessBuffer[i];
            const evaluatedGuess = this.evaluateGuess(guess, this.words[i]);

            if (evaluatedGuess.resultType === GuessResultType.Error) {
                this.handleError();
                return;
            }

            results.push(evaluatedGuess);
        }

        this.evaluateResults(results);
    }

    private handleError() {
        alert("ERROR: Your guess \"" + this.guessBuffer[0].join("") + "\" was not in the game dictionary.")
    }

    private evaluateResults(results: GuessResult[]) {
        this.active = this.currentTry < Config.NUM_TRIES;

        // Face x Cube Update Data. Goes up to the second to last index of the face, 
        // as each next face will handle that value
        const renderQueue: (CubeUpdateData | null)[] = [];

        for (let i = 0; i < Constants.NUMBER_OF_WORDS; i++) {
            const indexOffset = i * (Config.NUM_LETTERS - 1);

            // Make sure player hasn't already won this word
            if (!this.correctGuessIndices.has(i)) {
                const result = results[i];

                // Handle the first index first to check for an intersection
                const prevIndex = i === 0 ? Constants.NUMBER_OF_WORDS - 1 : i - 1;
                let isIntersection = this.doSidesIntersect(results[prevIndex], result);

                // Handle the intersection case
                renderQueue.push(
                    {
                        color: isIntersection ? result.resultList[0] : LetterResultType.get("mixed"),
                        index: indexOffset,
                        try: this.currentTry
                    });

                // We will go to the (n-1)th result because we handle the intersection case above
                for (let letterIndex = 1; letterIndex < Config.NUM_LETTERS - 1; letterIndex++) {
                    renderQueue.push(
                        {
                            color: result.resultList[letterIndex],
                            index: indexOffset + letterIndex,
                            try: this.currentTry
                        });
                }


            } else {
                Array.from({ length: Config.NUM_LETTERS - 1 }, () => null).forEach((item) => renderQueue.push(item));
            }
        }

        this.resetGuessBuffer();

        // Handle results animations
        this.renderer.animateGuess(renderQueue, () => {
            this.currentTry += 1;

            if (!results.every((result) => result.resultType === GuessResultType.Win)) {
                if (this.currentTry === Config.NUM_TRIES) {
                    this.handleEndGame("loss");
                }
            } else {
                this.handleEndGame("win");
            }
        });
    }

    private doSidesIntersect(previousResult: GuessResult, thisResult: GuessResult): boolean {
        return previousResult.resultList[previousResult.resultList.length - 1] === thisResult.resultList[0];
    }

    private handleEndGame(result: "win" | "loss") {
        if (result === "win") {
            alert("Massive W");
        } else {
            alert("L");
        }
    }

    private evaluateGuess(guessArray: string[], currentWord: string[]): GuessResult {
        const guessWord = guessArray.join("");

        // Handle error state
        if (!validDict.includes(guessWord.toLowerCase())) {
            return { resultType: GuessResultType.Error, resultList: [] } as GuessResult;
        }

        // Handle win case
        if (guessArray.join("") === currentWord.join("")) {
            return {
                resultType: GuessResultType.Win,
                resultList: Array.from({ length: Config.NUM_LETTERS }, () => LetterResultType.get("match")),
            };
        }

        // Handle valid case
        const currentWordCopy = currentWord.slice();
        const resultList: string[] = Array.from({ length: Config.NUM_LETTERS }, () => LetterResultType.get("wrong"));

        // Find matches
        guessArray.forEach((char, index) => {
            if (currentWordCopy[index] === char) {
                currentWordCopy[index] = "";
                resultList[index] = LetterResultType.get("match");
            }
        });

        // Find all letters that are not matches but are in the secret word
        currentWordCopy.forEach((char) => {
            const guessIndex = guessArray.indexOf(char);
            if (guessIndex !== -1) {
                resultList[guessIndex] = LetterResultType.get("close");
                guessArray[guessIndex] = "."; // Use another character to signify deletion
            }
        });

        return { resultType: GuessResultType.Valid, resultList };

    }

    private getRandomWord() {
        return gameDict[Math.random() * gameDict.length | 0];
    }

    private resetGuessBuffer() {
        this.guessBuffer = [];

        for (let i = 0; i < Constants.NUMBER_OF_WORDS; i++) {
            this.guessBuffer.push([]);
        }
    }
}