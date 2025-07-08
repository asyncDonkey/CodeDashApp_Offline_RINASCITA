// js/animation.js - (MODIFIED)

export class SpriteAnimation {

    
    constructor(spritesheet, frameWidth, frameHeight, numFrames, animationSpeed = 0.1) {
        //console.log(`DEBUG_ANIMATION: Creating SpriteAnimation for spritesheet.src: ${spritesheet.src}`);
        //console.log(`DEBUG_ANIMATION:  - frameWidth: ${frameWidth}, frameHeight: ${frameHeight}, numFrames: ${numFrames}`);
        //console.log(`DEBUG_ANIMATION:  - spritesheet.naturalWidth: ${spritesheet.naturalWidth}, spritesheet.naturalHeight: ${spritesheet.naturalHeight}`);
        this.spritesheet = spritesheet;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.numFrames = numFrames;
        this.animationSpeed = animationSpeed;
        this.currentFrameIndex = 0;
        this.elapsedTime = 0;
        if (numFrames <= 0) {
            console.warn('Animazione creata con 0 o meno frame!', spritesheet ? spritesheet.src : 'Spritesheet nullo');

            
        // Basic validation (can be more robust)
        if (spritesheet.naturalWidth === 0 || spritesheet.naturalHeight === 0) {
            //console.warn(`DEBUG_ANIMATION: Spritesheet has zero natural dimensions: ${spritesheet.src}`);
            this.isValid = false; // Mark as invalid
        } else if (spritesheet.naturalWidth % frameWidth !== 0 || spritesheet.naturalHeight % frameHeight !== 0) {
            //console.warn(`DEBUG_ANIMATION: Spritesheet dimensions (${spritesheet.naturalWidth}x${spritesheet.naturalHeight}) are not perfectly divisible by frame dimensions (${frameWidth}x${frameHeight}). May cause rendering issues for: ${spritesheet.src}`);
            this.isValid = true; // Still consider valid, but warn
        } else {
            this.isValid = true;
        }
    }
    }

    update(deltaTime) {
        if (this.numFrames <= 1) return; // Non animare se c'è solo un frame o nessuno
        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= this.animationSpeed) {
            this.elapsedTime -= this.animationSpeed;
            this.currentFrameIndex = (this.currentFrameIndex + 1) % this.numFrames;
        }
    }

    getFrame() {
        const sx = this.currentFrameIndex * this.frameWidth;
        const sy = 0; // Assumendo spritesheet a singola riga
        return { sx, sy, sWidth: this.frameWidth, sHeight: this.frameHeight };
    }

    reset() {
        this.currentFrameIndex = 0;
        this.elapsedTime = 0;
    }
}
