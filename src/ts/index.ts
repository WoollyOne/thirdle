import * as THREE from "three";
import { BoxGeometry, Mesh, MeshBasicMaterial, MeshPhongMaterial, PerspectiveCamera, PointLight, Scene, Texture, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

import { Config } from "./config";
import { FaceReference } from "./facereference";
import { CubeFace, getAsOffset, getAsRotation } from "./cubeface";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { GameHandler } from "./game";
import { InputHandler } from "./inputhandler";
import { KeyboardComponent } from "./keyboard";

// Handles dynamic rendering of index.html
export class IndexComponent {

    // Three.js properties
    public scene: Scene;
    public camera: PerspectiveCamera;
    public renderer: WebGLRenderer;
    public controls: OrbitControls;
    public light: PointLight;
    public hdr: Texture;

    public cubes: FaceReference[][] = [];
    public cubeMaterial: MeshPhongMaterial;
    public textGeometries: Map<string, TextGeometry> = new Map();

    public gameHandler: GameHandler;
    public inputHandler: InputHandler;

    public calculatedProperties: { xWidth: number, yWidth: number; zWidth: number } = { xWidth: undefined, yWidth: undefined, zWidth: undefined }

    constructor() {
        // Initialize properties
        this.calculatedProperties.xWidth = this.getWidth("x");
        this.calculatedProperties.yWidth = this.getWidth("y");
        this.calculatedProperties.zWidth = this.getWidth("z");

        // Initialize graphics
        this.startThree();
        this.endLoadingSequence()

        // Start game
        this.gameHandler = new GameHandler(this);

        // Render keyboard
        new KeyboardComponent();

        // Start reading inputs
        this.inputHandler = new InputHandler(this, this.gameHandler);
    }

    startThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.light = new THREE.PointLight(0xffffff, 1, 100);
        this.hdr = this.getHdr();

        // SETUP CONTROLS
        this.createControls();

        // SETUP RENDERER
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;

        document.body.appendChild(this.renderer.domElement);

        // Create objects
        this.scene.background = THREE.Texture.DEFAULT_IMAGE;
        this.scene.add(this.light);

        // Create materials
        this.cubeMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            opacity: 0.75,
            shininess: 0.5,
            reflectivity: 0.75,
            envMap: this.hdr,
            side: THREE.FrontSide,
        });

        // Register font
        new FontLoader().setPath("fonts/").load("roboto.json", (font) => {
            this.createTextGeometries(font);
        });

        this.createCubes();

        this.renderer.render(this.scene, this.camera);
        this.render();
        this.animate();
    }

    getHdr(): Texture {
        const hdr = new RGBELoader()
            .setPath('hdr/')
            .load('main.hdr', function () {

                hdr.mapping = THREE.EquirectangularReflectionMapping;

                this.render();

            });

        return hdr;
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);;

        this.camera.position.set(0, Config.CAMERA_Y_DEFAULT, Config.CAMERA_Z_DEFAULT);

        this.controls.target = new THREE.Vector3(0, Config.CAMERA_Y_DEFAULT, -this.calculatedProperties.zWidth);
        this.controls.addEventListener('change', this.onOrbitChange.bind(this));
        this.controls.update();
    }

    render() {
        this.renderer.render(this.scene, this.camera)
    }

    onOrbitChange() {

        // The target on the x or z axis should never change
        this.controls.target = new THREE.Vector3(0, this.camera.position.y, -this.calculatedProperties.zWidth);


        // The target on the y axis should change to match camera
        this.render();
    }

    getWidth(dimension: "x" | "y" | "z"): number {
        const { numLetters, numTries, dimensions, offset } = { numLetters: Config.NUM_LETTERS, numTries: Config.NUM_TRIES, dimensions: Config.CUBE_SIZE, offset: Config.CUBE_OFFSET };
        switch (dimension) {
            case "x":
                return (numLetters * dimensions) + ((numLetters - 1) * offset)
            case "y":
                return (numTries * dimensions) + ((numTries - 1) * offset);
            case "z":
                return this.getWidth("x");
        }
    }

    createTextGeometries(font: Font) {
        for (const char of "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")) {
            this.textGeometries.set(char, new TextGeometry(char, {
                font,
                size: 0.4,
                height: 0.05,
                curveSegments: 12,

                bevelThickness: 0.01,
                bevelSize: 0.01,
                bevelSegments: 5,
                bevelEnabled: true
            }));
        }
    }

    createCubes() {
        const { numLetters, numTries, dimensions, offset, roundness, roundSegments } = { numLetters: Config.NUM_LETTERS, numTries: Config.NUM_TRIES, dimensions: Config.CUBE_SIZE, offset: Config.CUBE_OFFSET, roundness: Config.CUBE_ROUNDNESS, roundSegments: Config.CUBE_ROUND_SEGMENTS }
        const geometry = new RoundedBoxGeometry(dimensions, dimensions, dimensions, roundSegments, roundness);
        const calculatedWidth = this.calculatedProperties.xWidth;
        const calculatedHeight = this.calculatedProperties.yWidth;
        const calculatedZDepth = this.calculatedProperties.zWidth;

        // Render each of the cubes
        // Render in order of try so we can store each cube reference by corresponding try
        for (let tryIndex = 0; tryIndex < numTries; tryIndex++) {
            let tryCubeArray: [Mesh, number, number][] = []; // Stored cube mesh, letter index, z index
            for (let zIndex = 0; zIndex < numLetters; zIndex++) {
                for (let letterIndex = 0; letterIndex < numLetters; letterIndex++) {
                    // Render a hollow cube made up of each cube only
                    // If we're on the front or back faces, we're fine
                    if (zIndex !== 0 && zIndex !== numLetters - 1) {
                        // If we're in the horizontal center of the cube
                        if (letterIndex !== 0 && letterIndex !== numLetters - 1) {
                            // If we're in the vertical center of the cube
                            continue;

                        }
                    }
                    const cube = new Mesh(geometry, this.cubeMaterial);
                    const spacing = dimensions + offset;
                    const positionX = (letterIndex * spacing) + (dimensions / 2);
                    const positionY = ((numTries - tryIndex - 1) * spacing) + (dimensions / 2);
                    const positionZ = (-zIndex * spacing) - (dimensions / 2);

                    cube.position.setX(positionX - (calculatedWidth / 2));
                    cube.position.setY(positionY - (calculatedHeight / 2));
                    cube.position.setZ(positionZ - (calculatedZDepth / 2));

                    this.scene.add(cube);
                    tryCubeArray.push([cube, letterIndex, zIndex]);
                }
            }
            let tryFaceReferenceArray: FaceReference[] = [];
            for (const cube of tryCubeArray) {
                this.storeCubeInCubeArray(tryFaceReferenceArray, cube[0], cube[1], tryIndex, cube[2]);
            }
            this.cubes.push(tryFaceReferenceArray);
        }
    }

    renderTextForCubes(text: string | undefined, currentTry: number, letterIndex: number) {
        if (text != null && !this.textGeometries.has(text)) {
            throw new Error("No text geometry found for " + text);
        }

        const textFloatDistance = Config.TEXT_FLOAT_DISTANCE;
        const simpleMaterial = new MeshBasicMaterial({ color: 0x111111 });
        const currentArray = this.cubes[currentTry];

        for (const faceReference of currentArray) {
            if (faceReference.letter !== letterIndex) {
                continue;
            }

            // Unrender a text character
            if (!text) {
                if (!faceReference.renderedLetter) {
                    throw new Error(`Attempted to unrender nonexistant letter (currentTry: ${currentTry}, letterIndex: ${letterIndex})`);
                }

                this.scene.remove(faceReference.renderedLetter);
                faceReference.renderedLetter = undefined;
                continue;
            }

            if (faceReference.renderedLetter != null) {
                throw new Error(`FaceReference already has a letter assigned to it (currentTry: ${currentTry}, letterIndex: ${letterIndex})`);
            }

            const textGeometry = this.textGeometries.get(text);

            textGeometry.computeBoundingBox();
            const width = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            const height = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
            const depth = textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z;

            const textMesh = new THREE.Mesh(textGeometry, simpleMaterial);

            const offset = getAsOffset(faceReference.face);
            textMesh.position.x = (faceReference.cube.position.x + (offset.x * textFloatDistance));
            textMesh.position.y = (faceReference.cube.position.y + (offset.y * textFloatDistance));
            textMesh.position.z = (faceReference.cube.position.z + (offset.z * textFloatDistance));
            textMesh.rotation.y = getAsRotation(faceReference.face);

            switch (faceReference.face) {
                case CubeFace.South:
                    textMesh.position.x -= width / 2;
                    textMesh.position.y -= height / 2;
                    textMesh.position.z -= depth / 2;
                    break;
                case CubeFace.East:
                    textMesh.position.z += width / 2;
                    textMesh.position.y -= height / 2;
                    textMesh.position.x -= depth / 2;
                    break;
                case CubeFace.North:
                    textMesh.position.x += width / 2;
                    textMesh.position.y -= height / 2;
                    textMesh.position.z += depth / 2;
                    break;
                case CubeFace.West:
                    textMesh.position.z -= width / 2;
                    textMesh.position.y -= height / 2;
                    textMesh.position.x += depth / 2;
                    break;
            }
            this.scene.add(textMesh);
            faceReference.renderedLetter = textMesh;
        }
    }

    testCubeGeometry() {
        const textFloatDistance = Config.TEXT_FLOAT_DISTANCE;

        new FontLoader().setPath("fonts/").load("roboto.json", (font) => {
            const simpleMaterial = new MeshBasicMaterial({ color: 0x111111 });

            for (const tryFaceReferences of this.cubes) {
                for (const faceReference of tryFaceReferences) {
                    const textGeometry = new TextGeometry(faceReference.try.toString() + faceReference.letter.toString(), {

                        font,
                        size: 0.4,
                        height: 0.05,
                        curveSegments: 12,

                        bevelThickness: 0.01,
                        bevelSize: 0.01,
                        bevelSegments: 5,
                        bevelEnabled: true
                    });

                    textGeometry.computeBoundingBox();
                    const width = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                    const height = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
                    const depth = textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z;

                    const textMesh = new THREE.Mesh(textGeometry, simpleMaterial);

                    const offset = getAsOffset(faceReference.face);
                    textMesh.position.x = (faceReference.cube.position.x + (offset.x * textFloatDistance));
                    textMesh.position.y = (faceReference.cube.position.y + (offset.y * textFloatDistance));
                    textMesh.position.z = (faceReference.cube.position.z + (offset.z * textFloatDistance));
                    textMesh.rotation.y = getAsRotation(faceReference.face);

                    switch (faceReference.face) {
                        case CubeFace.South:
                            textMesh.position.x -= width / 2;
                            textMesh.position.y -= height / 2;
                            textMesh.position.z -= depth / 2;
                            break;
                        case CubeFace.East:
                            textMesh.position.z += width / 2;
                            textMesh.position.y -= height / 2;
                            textMesh.position.x -= depth / 2;
                            break;
                        case CubeFace.North:
                            textMesh.position.x += width / 2;
                            textMesh.position.y -= height / 2;
                            textMesh.position.z += depth / 2;
                            break;
                        case CubeFace.West:
                            textMesh.position.z -= width / 2;
                            textMesh.position.y -= height / 2;
                            textMesh.position.x += depth / 2;
                            break;
                    }
                    this.scene.add(textMesh);
                }
            }
        });
    }

    storeCubeInCubeArray(cubeArray: FaceReference[], cube: Mesh, letterIndex: number, tryIndex: number, zIndex: number) {
        const numLetters = Config.NUM_LETTERS;
        // Store the cube data in the cube array. Letter starting postion wraps counter-clockwise. 
        // Try index will ALWAYS correspond to the correct try.

        // SW edge
        if (letterIndex === 0 && zIndex === 0) {
            cubeArray.push({ cube, face: CubeFace.South, letter: 0, try: tryIndex });
            cubeArray.push({ cube, face: CubeFace.West, letter: numLetters - 1, try: tryIndex });
        }
        // SE edge
        else if (letterIndex === numLetters - 1 && zIndex === 0) {
            cubeArray.push({ cube, face: CubeFace.South, letter: numLetters - 1, try: tryIndex });
            cubeArray.push({ cube, face: CubeFace.East, letter: 0, try: tryIndex });
        }
        // NW edge
        else if (letterIndex === 0 && zIndex === numLetters - 1) {
            cubeArray.push({ cube, face: CubeFace.North, letter: numLetters - 1, try: tryIndex });
            cubeArray.push({ cube, face: CubeFace.West, letter: 0, try: tryIndex });
        }
        // NE edge
        else if (letterIndex === numLetters - 1 && zIndex === numLetters - 1) {
            cubeArray.push({ cube, face: CubeFace.North, letter: 0, try: tryIndex });
            cubeArray.push({ cube, face: CubeFace.East, letter: numLetters - 1, try: tryIndex });
        }
        // Somewhere in the center
        else {
            // S face
            if (zIndex === 0) {
                cubeArray.push({ cube, face: CubeFace.South, letter: letterIndex, try: tryIndex });
            }
            // N face
            if (zIndex === numLetters - 1) {
                cubeArray.push({ cube, face: CubeFace.North, letter: numLetters - letterIndex - 1, try: tryIndex });
            }
            // Between the two faces, not an edge
            else {
                // W face
                if (letterIndex === 0) {
                    cubeArray.push({ cube, face: CubeFace.West, letter: numLetters - zIndex - 1, try: tryIndex });
                }
                // E face
                if (letterIndex === numLetters - 1) {
                    cubeArray.push({ cube, face: CubeFace.East, letter: zIndex, try: tryIndex });
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.light.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        this.render();
    }

    initListeners() {

    }

    endLoadingSequence() {
        console.log("Loading done");
    }
}

new IndexComponent();