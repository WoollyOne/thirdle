import * as THREE from "three";
import { Color, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PerspectiveCamera, PointLight, Scene, Texture, WebGLRenderer } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

import { Config } from "./config";
import { CubeReference } from "./cubereference";
import { CubeFace, getAsOffset, getAsRotation } from "./cubeface";
import { threadId } from "worker_threads";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

// Handles dynamic rendering of index.html
class IndexComponent {

    // Three.js properties
    public scene: Scene;
    public camera: PerspectiveCamera;
    public renderer: WebGLRenderer;
    public controls: OrbitControls;
    public light: PointLight;
    public hdr: Texture;

    public cubes: CubeReference[] = [];
    public cubeMaterial: MeshPhysicalMaterial;

    constructor() {
        this.startThree();
        this.initListeners();
        this.endLoadingSequence()
    }

    startThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.light = new THREE.PointLight(0xffffff, 1, 100);
        this.hdr = this.getHdr();

        // SETUP CONTROLS
        this.controls = this.createControls();

        // SETUP RENDERER
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;

        document.body.appendChild(this.renderer.domElement);

        // Create objects
        this.scene.background = this.hdr;
        this.scene.add(this.light);

        this.cubeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 1,
            opacity: 1,
            metalness: 0,
            roughness: 0.1,
            ior: 1.5,
            specularIntensity: 1,
            specularColor: new Color(255, 255, 255),
            envMapIntensity: 6,
            envMap: this.hdr,
            transparent: true,
            side: THREE.FrontSide,
        });

        this.createCubes();

        this.renderer.render(this.scene, this.camera);
        this.render();
        this.animate();
    }

    getHdr(): Texture {
        const hdr = new RGBELoader()
            .setPath('hdr/')
            .load('Milkyway_Light.hdr', function () {

                hdr.mapping = THREE.EquirectangularReflectionMapping;

                this.render();

            });

        return hdr;
    }

    createControls(): OrbitControls {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        const yPos = this.getWidth("y");
        this.camera.position.set(0, yPos, 0);

        const zDepth = this.getWidth("z");
        controls.target = new THREE.Vector3(0, yPos, -zDepth);
        controls.addEventListener('change', this.render.bind(this));

        controls.update();

        return controls;
    }

    render() {
        this.renderer.render(this.scene, this.camera)
    }

    getWidth(dimension: "x" | "y" | "z"): number {
        const { numLetters, numTries, dimensions, offset } = { numLetters: Config.NUM_LETTERS, numTries: Config.NUM_TRIES, dimensions: Config.CUBE_SIZE, offset: Config.CUBE_OFFSET };
        switch (dimension) {
            case "x":
                return (numLetters * dimensions) + ((numLetters - 1) * offset)
            case "y":
                return (numLetters * dimensions) + ((numTries - 1) * offset);
            case "z":
                return this.getWidth("y");
        }
    }

    createCubes() {
        const { numLetters, numTries, dimensions, offset, roundness, roundSegments } = { numLetters: Config.NUM_LETTERS, numTries: Config.NUM_TRIES, dimensions: Config.CUBE_SIZE, offset: Config.CUBE_OFFSET, roundness: Config.CUBE_ROUNDNESS, roundSegments: Config.CUBE_ROUND_SEGMENTS }
        const geometry = new RoundedBoxGeometry(dimensions, dimensions, dimensions, roundSegments, roundness);
        const calculatedWidth = this.getWidth("x");
        const calculatedHeight = this.getWidth("y");

        // Render each of the cubes
        for (let zIndex = 0; zIndex < numLetters; zIndex++) {
            for (let tryIndex = 0; tryIndex < numTries; tryIndex++) {
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
                    cube.position.setX(letterIndex * (dimensions + offset) - (calculatedWidth / 2));
                    cube.position.setY(((numTries - tryIndex - 1) * (dimensions + offset)) - (calculatedHeight / 2));
                    cube.position.setZ((-zIndex * (dimensions + offset)) - 5);
                    this.scene.add(cube);

                    this.storeCubeInCubeArray(cube, letterIndex, tryIndex, zIndex);
                }
            }
        }

        this.testCubeGeometry();
    }

    testCubeGeometry() {
        const text: string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const textFloatDistance = Config.TEXT_FLOAT_DISTANCE;

        new FontLoader().setPath("fonts/").load("roboto.json", (font) => {
            const simpleMaterial = new MeshBasicMaterial({ color: 0x111111 });

            for (const cubeReference of this.cubes) {
                const textGeometry = new TextGeometry(text[cubeReference.letter], {

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

                const offset = getAsOffset(cubeReference.face);
                textMesh.position.x = (cubeReference.cube.position.x + (offset.x * textFloatDistance));
                textMesh.position.y = (cubeReference.cube.position.y + (offset.y * textFloatDistance));
                textMesh.position.z = (cubeReference.cube.position.z + (offset.z * textFloatDistance));
                textMesh.rotation.y = getAsRotation(cubeReference.face);

                switch (cubeReference.face) {
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
        });
    }

    storeCubeInCubeArray(cube: Mesh, letterIndex: number, tryIndex: number, zIndex: number) {
        const numLetters = Config.NUM_LETTERS;
        // Store the cube data in the cube array. Letter starting postion wraps counter-clockwise. 
        // Try index will ALWAYS correspond to the correct try.

        // SW edge
        if (letterIndex === 0 && zIndex === 0) {
            this.cubes.push({ cube, face: CubeFace.South, letter: 0, try: tryIndex });
            this.cubes.push({ cube, face: CubeFace.West, letter: numLetters - 1, try: tryIndex });
        }
        // SE edge
        else if (letterIndex === numLetters - 1 && zIndex === 0) {
            this.cubes.push({ cube, face: CubeFace.South, letter: numLetters - 1, try: tryIndex });
            this.cubes.push({ cube, face: CubeFace.East, letter: 0, try: tryIndex });
        }
        // NW edge
        else if (letterIndex === 0 && zIndex === numLetters - 1) {
            this.cubes.push({ cube, face: CubeFace.North, letter: numLetters - 1, try: tryIndex });
            this.cubes.push({ cube, face: CubeFace.West, letter: 0, try: tryIndex });
        }
        // NE edge
        else if (letterIndex === numLetters - 1 && zIndex === numLetters - 1) {
            this.cubes.push({ cube, face: CubeFace.North, letter: 0, try: tryIndex });
            this.cubes.push({ cube, face: CubeFace.East, letter: numLetters - 1, try: tryIndex });
        }
        // Somewhere in the center
        else {
            // S face
            if (zIndex === 0) {
                this.cubes.push({ cube, face: CubeFace.South, letter: letterIndex, try: tryIndex });
            }
            // N face
            if (zIndex === numLetters - 1) {
                this.cubes.push({ cube, face: CubeFace.North, letter: numLetters - letterIndex - 1, try: tryIndex });
            }
            // Between the two faces, not an edge
            else {
                // W face
                if (letterIndex === 0) {
                    this.cubes.push({ cube, face: CubeFace.West, letter: numLetters - zIndex - 1, try: tryIndex });
                }
                // E face
                if (letterIndex === numLetters - 1) {
                    this.cubes.push({ cube, face: CubeFace.East, letter: zIndex, try: tryIndex });
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

export const indexComponent = new IndexComponent();