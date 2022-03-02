import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import { BoxGeometry, Group, Light, Mesh, MeshBasicMaterial, MeshPhongMaterial, PerspectiveCamera, Scene, Texture, WebGLRenderer } from "three";
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { IndexComponent } from "..";
import { Config } from "../exportable/config";
import { convertIndexWithSequentialOrdering, getWidth, normalizeInBounds } from "../exportable/util";
import { CubeFace, getAsOffset, getAsRotation } from "../model/cubeface/cubeface";
import { CubeUpdateData } from "../model/cubeface/cubeupdatedata";
import { FaceReference } from "../model/cubeface/facereference";
import { LetterResultType } from "../model/guessresults";
import { getSwipeDirection, SwipeDirection } from "../model/swipedirection";
import { ThirdleAnimation } from "./thirdleanimation";

export class Renderer {
    // Three.js properties
    public scene: Scene;
    public camera: PerspectiveCamera;
    public renderer: WebGLRenderer;
    public light: Light;
    public hdr: Texture;

    public cubeMeshes: Mesh[] = [];
    public towerGroup: Group;
    public cubes: FaceReference[][] = [];
    public cubeMaterials: Map<string, MeshPhongMaterial> = new Map();
    public textGeometries: Map<string, TextGeometry> = new Map();

    public readonly calculatedProperties = this.indexComponent.calculatedProperties;
    public currentAnimations = new Set<ThirdleAnimation>();
    public currentTowerRotation: number = 0;

    constructor(public indexComponent: IndexComponent) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, Config.CAMERA_Y_DEFAULT, Config.CAMERA_Z_DEFAULT);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.light = new THREE.DirectionalLight(0xffffff, 0.5);

        // SETUP RENDERER
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;

        document.body.appendChild(this.renderer.domElement);

        // Create materials
        this.createCubeMaterials();

        // Create objects
        this.scene.add(this.light);
        this.scene.background = Config.BACKGROUND_COLOR;

        // Register font
        new FontLoader().setPath("fonts/").load("roboto.json", (font) => {
            this.createTextGeometries(font);
        });

        this.createCubes();

        this.renderer.render(this.scene, this.camera);
        this.render();
        requestAnimationFrame(this.animate.bind(this));

        // Initial animations
        this.animateCubesAppear();
    }

    createTestGeo() {
        const tl = new Mesh(new BoxGeometry(1, 1, 1));
        tl.position.set(-5.4 / 2, 13.1 / 2, -5.4 / 2);

        const tr = new Mesh(new BoxGeometry(1, 1, 1));
        tr.position.set(5.4 / 2, 13.1 / 2, -5.4 / 2);

        const bl = new Mesh(new BoxGeometry(1, 1, 1));
        bl.position.set(-5.4 / 2, 13.1 / 2, 5.4 / 2);

        const br = new Mesh(new BoxGeometry(1, 1, 1));
        br.position.set(5.4 / 2, 13.1 / 2, 5.4 / 2);

        const c = new Mesh(new BoxGeometry(1, 1, 1));
        c.position.set(0, 13.1 / 2, 0);

        this.scene.add(tl, tr, bl, br, c);
    }

    createCubeMaterials() {
        for (const color of LetterResultType.values()) {
            this.cubeMaterials.set(color, new THREE.MeshPhongMaterial({
                color,
                reflectivity: 0,
                side: THREE.FrontSide,
            }));
        }
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

    render() {
        this.renderer.render(this.scene, this.camera)
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
        this.towerGroup = new Group();

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
                    const cube = new Mesh(geometry, this.cubeMaterials.get(LetterResultType.get("default_value")));
                    const spacing = dimensions + offset;
                    const positionX = (letterIndex * spacing) + (dimensions / 2);
                    const positionY = ((numTries - tryIndex - 1) * spacing) + (dimensions / 2);
                    const positionZ = (-zIndex * spacing) - (dimensions / 2);

                    cube.position.setX(positionX - (calculatedWidth / 2));
                    cube.position.setY(positionY - (calculatedHeight / 2));
                    cube.position.setZ(positionZ + (calculatedZDepth / 2));
                    cube.scale.set(0, 0, 0);

                    this.towerGroup.add(cube);
                    this.cubeMeshes.push(cube);
                    tryCubeArray.push([cube, letterIndex, zIndex]);
                }
            }
            let tryFaceReferenceArray: FaceReference[] = [];
            for (const cubeData of tryCubeArray) {
                this.indexComponent.storeCubeInCubeArray({ cubeArray: tryFaceReferenceArray, cube: cubeData[0], letterIndex: cubeData[1], tryIndex, zIndex: cubeData[2] });
            }
            this.cubes.push(tryFaceReferenceArray);
        }

        this.scene.add(this.towerGroup);
    }

    renderTextForCubes(text: string | undefined, currentTry: number, letterIndex: number) {
        if (text != null && !this.textGeometries.has(text)) {
            throw new Error("No text geometry found for " + text);
        }

        const textFloatDistance = Config.TEXT_FLOAT_DISTANCE;
        const simpleMaterial = new MeshBasicMaterial({ color: Config.TEXT_COLOR });
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

                this.towerGroup.remove(faceReference.renderedLetter);
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
            this.towerGroup.add(textMesh);
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

    public animateGuess(renderQueue: (CubeUpdateData | null)[], onFinish = () => { }) {
        const animationEntries = [];
        for (let renderObject of renderQueue) {
            if (renderObject === null) {
                animationEntries.push(null)
            } else {
                const index = convertIndexWithSequentialOrdering(renderObject.index);
                const cube = this.cubeMeshes[index];
                // console.log("Render from", renderObject.index + " => " + index);
                animationEntries.push({ cube, color: renderObject.color });
            }
        }

        // Recursively animate the colors for each side
        this._animateGuessNext(
            animationEntries,
            0,
            () => {
                this.currentAnimations.delete(ThirdleAnimation.GUESS_ANIMATION);
                onFinish();
            });
    }

    // Called to render each face
    private _animateGuessNext(
        entries: { cube: Mesh | null, color: string }[],
        startIndex: number,
        onFinish: () => void
    ) {
        if (startIndex === 4) {
            onFinish();
            return;
        }

        const factor = Config.NUM_LETTERS - 1;
        const offset = startIndex * factor;
        //0 3, 4 7, 8 11, 12 15
        const animationEntries = entries.slice(offset, offset + factor);
        console.log("SI", startIndex, "Slice from", offset, "=> ", (offset + factor))

        const targetRotation = (-2 * Math.PI) * startIndex / 4;

        const onCubeChangeColorFinish = () => {
            this.currentTowerRotation = targetRotation;
            this._animateGuessNext(entries, startIndex + 1, onFinish);

        };

        // First rotate the camera to the correct spot
        new TWEEN.Tween({ y: this.currentTowerRotation })
            .to({ y: targetRotation }, 100).easing(TWEEN.Easing.Cubic.Out)
            .onUpdate((value: { y: number }) => { this.towerGroup.rotation.y = value.y; })
            .onComplete(() => {
                // Animate the next batch of cubes (or skip), then call this function again
                if (animationEntries[offset] !== null) {
                    this.animateChangeCubeColor(animationEntries, onCubeChangeColorFinish);
                } else {
                    // Do finish function after short delay
                    setTimeout(onCubeChangeColorFinish, 100);
                }
            }).start();
    }

    animateChangeCubeColor(entries: { cube: Mesh, color: string }[], onFinish: () => void) {
        this.currentAnimations.add(ThirdleAnimation.CUBE_COLOR_CHANGE);

        const cube = entries[0].cube;
        const color = entries[0].color;
        entries = entries.slice(1);

        new TWEEN.Tween({ x: 0 })
        const letters = this.indexComponent.cubeReferenceMap.get(cube).map(face => face.letter).filter(letter => letter != null);

        const scaleUpdateFunction = (value: { x: number }) => {
            cube.scale.set(value.x, value.x, value.x);
            if (value.x === 0) {
                cube.material = this.cubeMaterials.get(color);
            }
        }

        const newMaterial = this.cubeMaterials.get(color);

        const rotateUpdateFunction = (value: { x: number }) => {
            cube.rotation.y = (Math.PI * 8) * value.x;
            if (value.x >= 0.5 && cube.material !== newMaterial) {
                cube.material = newMaterial;
            }
        }

        // new TWEEN.Tween({ x: 1 })
        //     .to({ x: 0 }, 250).yoyo(true).repeat(1).easing(TWEEN.Easing.Cubic.InOut)
        //     .onUpdate(scaleUpdateFunction).start();

        new TWEEN.Tween({ x: 0 })
            .to({ x: 1 }, 500).easing(TWEEN.Easing.Cubic.Out)
            .onUpdate(rotateUpdateFunction).onComplete(() => {
                this.currentAnimations.delete(ThirdleAnimation.CUBE_COLOR_CHANGE);
                if (entries.length !== 0) {
                    this.animateChangeCubeColor(entries, onFinish);
                } else {
                    onFinish();
                }
            }).start();
    }

    animateCubesAppear() {
        const totalTime = Config.CUBE_APPEAR_CAMERA_TIME;
        const lowestY = this.cubeMeshes[this.cubeMeshes.length - 1].position.y;

        const cameraUpdateFunction = (value: { y: number }) => {
            const normalizedY = normalizeInBounds(value.y, lowestY, Config.CAMERA_Y_DEFAULT);
            this.camera.position.setY(value.y)
            const twoPi = Math.PI;
            this.towerGroup.rotation.y = (normalizedY * twoPi) - twoPi;
        };
        // Animate the camera from the bottom
        new TWEEN.Tween({ y: lowestY })
            .to({ y: Config.CAMERA_Y_DEFAULT }, totalTime)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(cameraUpdateFunction)
            .start();

        // Animate the cubes in
        const animateInNext = (index: number) => {
            if (index >= this.cubeMeshes.length) {
                return;
            }

            const cubeMesh = this.cubeMeshes[this.cubeMeshes.length - index - 1];
            const scaleInFunction = (value: { x: number }) => {
                cubeMesh.scale.set(value.x, value.x, value.x);
            }

            new TWEEN.Tween({ x: 0 }).to({ x: 1 }, Config.CUBE_APPEAR_SPEED)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate(scaleInFunction)
                .start();

            setTimeout(() => animateInNext(index + 1), Config.CUBE_APPEAR_DELAY);
        }

        animateInNext(0);
    }

    public dragMoveView(delta: [number, number]) {
        if (!(getSwipeDirection(delta) === SwipeDirection.Left || getSwipeDirection(delta) === SwipeDirection.Right)) {
            return;
        }

        const deltaX = delta[0];

        const peekAmount = (deltaX / Config.SWIPE_DELTA_THRESHOLD) * (Math.PI / 4);
        this.towerGroup.rotation.y = this.currentTowerRotation + peekAmount;
    }

    public dragMoveViewDrop() {
        const currentActualRotation = this.towerGroup.rotation.y;
        new TWEEN.Tween({ x: currentActualRotation })
            .to({ x: this.currentTowerRotation }, Config.SWIPE_SPEED)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate((value: { x: number }) => this.towerGroup.rotation.y = value.x)
            .onComplete(() => this.currentAnimations.delete(ThirdleAnimation.SWIPE))
            .start();
    }

    public swipeMoveView(direction: SwipeDirection) {
        if (direction === SwipeDirection.Left || direction === SwipeDirection.Right) {

            const currentSnappedRotation = this.currentTowerRotation;
            let rotateAmount = Math.PI / 2;

            if (direction === SwipeDirection.Left) {
                rotateAmount *= -1;
            }

            const lastRotation = this.towerGroup.rotation.y;
            let nextRotation = currentSnappedRotation + rotateAmount;

            this.currentAnimations.add(ThirdleAnimation.SWIPE);

            this.currentTowerRotation = nextRotation;

            new TWEEN.Tween({ x: lastRotation })
                .to({ x: nextRotation }, Config.SWIPE_SPEED)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate((value: { x: number }) => this.towerGroup.rotation.y = value.x)
                .onComplete(() => {
                    this.currentAnimations.delete(ThirdleAnimation.SWIPE);
                })
                .start();
        } else if (direction !== SwipeDirection.None) {
            const swipeDistance = Config.SWIPE_VERTICAL_DISTANCE;
            const currentY = this.camera.position.y;

            const maxYDisplacement = getWidth("y") / 2;

            let nextY;

            if (direction == SwipeDirection.Down) {
                nextY = Math.min(maxYDisplacement, currentY + swipeDistance);
            } else {
                nextY = Math.max(-maxYDisplacement, currentY - swipeDistance);
            }

            const cameraUpdateFunction = (value: { y: number }) => {
                this.camera.position.setY(value.y);
            };

            if (nextY !== currentY) {
                new TWEEN.Tween({ y: currentY })
                    .to({ y: nextY }, Config.SWIPE_SPEED)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .onUpdate(cameraUpdateFunction)
                    .onComplete(() => this.currentAnimations.delete(ThirdleAnimation.SWIPE))
                    .start();
            } else {
                const reverseFactor = currentY / Math.abs(currentY);
                new TWEEN.Tween({ y: currentY })
                    .to({ y: currentY + (reverseFactor * Config.SWIPE_NUDGE_DISTANCE) }, Config.SWIPE_SPEED / 2)
                    .to({ y: currentY }, Config.SWIPE_SPEED / 2)
                    .easing(TWEEN.Easing.Quadratic.InOut)
                    .onUpdate(cameraUpdateFunction)
                    .onComplete(() => this.currentAnimations.delete(ThirdleAnimation.SWIPE))
                    .start();
            }
        }
    }

    animate(time: number) {
        requestAnimationFrame(this.animate.bind(this));
        TWEEN.update(time);

        this.light.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        this.render();
    }

    endLoadingSequence() {
        console.log("Loading done");
    }
}