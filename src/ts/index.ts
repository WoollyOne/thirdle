import { Mesh } from "three";
import { Config } from "./exportable/config";
import { getWidth } from "./exportable/util";
import { GameHandler } from "./handlers/game";
import { InputHandler } from "./handlers/input";
import { CubeFace } from "./model/cubeface/cubeface";
import { FaceReference } from "./model/cubeface/facereference";
import { KeyboardComponent } from "./model/keyboard";
import { Renderer } from "./render/renderer";


// Handles dynamic rendering of index.html
export class IndexComponent {
    public gameHandler: GameHandler;
    public inputHandler: InputHandler;
    public renderer: Renderer;

    public cubeReferenceMap: Map<Mesh, FaceReference[]> = new Map();

    public calculatedProperties: { xWidth: number, yWidth: number; zWidth: number } = { xWidth: undefined, yWidth: undefined, zWidth: undefined }

    constructor() {
        // Initialize properties
        this.calculatedProperties.xWidth = getWidth("x");
        this.calculatedProperties.yWidth = getWidth("y");
        this.calculatedProperties.zWidth = getWidth("z");

        // Initialize graphics
        this.renderer = new Renderer(this);

        // Start game
        this.gameHandler = new GameHandler(this, this.renderer);

        // Render keyboard
        new KeyboardComponent();

        // Start reading inputs
        this.inputHandler = new InputHandler(this, this.gameHandler, this.renderer);
    }

    storeCubeInCubeArray({ cubeArray, cube, letterIndex, tryIndex, zIndex }:
        { cubeArray: FaceReference[]; cube: Mesh; letterIndex: number; tryIndex: number; zIndex: number; }) {
        const numLetters = Config.NUM_LETTERS;
        // Store the cube data in the cube array. Letter starting postion wraps counter-clockwise. 
        // Try index will ALWAYS correspond to the correct try.

        const cubeFacesAdded: FaceReference[] = [];
        // SW edge
        if (letterIndex === 0 && zIndex === 0) {
            cubeFacesAdded.push({ cube, face: CubeFace.South, letter: 0, try: tryIndex });
            cubeFacesAdded.push({ cube, face: CubeFace.West, letter: numLetters - 1, try: tryIndex });
        }
        // SE edge
        else if (letterIndex === numLetters - 1 && zIndex === 0) {
            cubeFacesAdded.push({ cube, face: CubeFace.South, letter: numLetters - 1, try: tryIndex });
            cubeFacesAdded.push({ cube, face: CubeFace.East, letter: 0, try: tryIndex });
        }
        // NW edge
        else if (letterIndex === 0 && zIndex === numLetters - 1) {
            cubeFacesAdded.push({ cube, face: CubeFace.North, letter: numLetters - 1, try: tryIndex });
            cubeFacesAdded.push({ cube, face: CubeFace.West, letter: 0, try: tryIndex });
        }
        // NE edge
        else if (letterIndex === numLetters - 1 && zIndex === numLetters - 1) {
            cubeFacesAdded.push({ cube, face: CubeFace.North, letter: 0, try: tryIndex });
            cubeFacesAdded.push({ cube, face: CubeFace.East, letter: numLetters - 1, try: tryIndex });
        }
        // Somewhere in the center
        else {
            // S face
            if (zIndex === 0) {
                cubeFacesAdded.push({ cube, face: CubeFace.South, letter: letterIndex, try: tryIndex });
            }
            // N face
            if (zIndex === numLetters - 1) {
                cubeFacesAdded.push({ cube, face: CubeFace.North, letter: numLetters - letterIndex - 1, try: tryIndex });
            }
            // Between the two faces, not an edge
            else {
                // W face
                if (letterIndex === 0) {
                    cubeFacesAdded.push({ cube, face: CubeFace.West, letter: numLetters - zIndex - 1, try: tryIndex });
                }
                // E face
                if (letterIndex === numLetters - 1) {
                    cubeFacesAdded.push({ cube, face: CubeFace.East, letter: zIndex, try: tryIndex });
                }
            }
        }

        cubeArray.push(...cubeFacesAdded);
        this.cubeReferenceMap.set(cube, cubeFacesAdded);
    }
}

new IndexComponent();