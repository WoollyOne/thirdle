import { Mesh } from "three";
import { CubeFace } from "./cubeface";

export interface CubeReference {
    cube: Mesh,
    face: CubeFace,
    letter: number,
    try: number,
    renderedLetter?: Mesh
}