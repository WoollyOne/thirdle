declare var require: any
import * as howler from 'howler';

export class SoundPlayer {
    public sounds = new Map<string, howler.Howl>();

    constructor() {
        this.initSounds();
    }

    public initSounds() {
    }

    public playSound(name: string) {
        this.sounds.get(name).play();
    }

    public getHowl(key: string): howler.Howl {
        return new howler.Howl({ src: [`sound/${key}.wav`] });
    }
}