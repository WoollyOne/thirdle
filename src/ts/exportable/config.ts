import * as THREE from "three";

export const Config = {
    // GAME
    NUM_LETTERS: 5,
    NUM_TRIES: 12,
    NUM_WORDS: 4,
    UI_UPDATE_SPEED: 350, // ms

    // SCENE
    BACKGROUND_COLOR: new THREE.Color(0x001c24),
    CUBE_COLOR: new THREE.Color(0x00303c),
    CUBE_WRONG: new THREE.Color(0x001c24),
    CUBE_CLOSE: new THREE.Color(0xc8c100),
    CUBE_MATCH: new THREE.Color(0x00c839),
    CUBE_MIXED: new THREE.Color(0x8200c8),

    // CUBE GRAPHIC PROPERTIES
    CUBE_SIZE: 1,
    CUBE_OFFSET: 0.1,
    CUBE_ROUNDNESS: 0.05,
    CUBE_ROUND_SEGMENTS: 8,

    // CUBE APPEAR
    CUBE_APPEAR_DELAY: 2,
    CUBE_APPEAR_CAMERA_TIME: 1800,
    CUBE_APPEAR_SPEED: 250,

    // CAMERA
    CAMERA_Y_DEFAULT: 4,
    CAMERA_Z_DEFAULT: 10,

    // TEXT
    TEXT_FLOAT_DISTANCE: 0.5,
    TEXT_COLOR: new THREE.Color(0xeeeeee),

    // GESTURES
    SWIPE_DELTA_THRESHOLD: 100,
    SWIPE_SPEED: 250,
    SWIPE_VERTICAL_DISTANCE: 2.5,
    SWIPE_NUDGE_DISTANCE: 1,

    // KEYBOARD
    KEYBOARD_LAYOUT: [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
    ],
    KEYBOARD_LAYOUT_BIG_KEYS: ["ENTER", "BACKSPACE"],
};