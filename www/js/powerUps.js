// www/js/powerUps.js

import { SpriteAnimation } from './animation.js';
import { GLOBAL_SPRITE_SCALE_FACTOR } from './donkeyRunner.js';
export const POWERUP_TYPE = {
  TRIPLE_SHOT: 'triple_shot',
  SHIELD: 'shield',
  SMART_BOMB: 'smart_bomb',
  DEBUG_MODE: 'debug_mode',
  FIREWALL: 'firewall',
  BLOCK_BREAKER: 'block_breaker',
  // NUOVI POWER-UP PERMANENTI
  SLAYER_SUBROUTINE: 'slayer_subroutine',
  CODE_INJECTOR: 'code_injector',
  REINFORCED_SHIELD: 'reinforced_shield',
  MACHINE_LANGUAGE: 'machine_language',
  // NUOVI POWER-UP DI MODULO 6
  BIT_VACUUM: 'bit_vacuum', // NUOVO
  PURGE_PROTOCOL: 'purge_protocol', // NUOVO
};

export const POWERUP_DURATION = {
  TRIPLE_SHOT: 10,
  SHIELD: 10,
  DEBUG_MODE: 10,
  FIREWALL: 8,
  BLOCK_BREAKER: 12,
  MACHINE_LANGUAGE: 10,
  // I power-up permanenti non avranno una durata in senso stretto,
  // ma mantengo queste costanti se dovessero servire per scopi secondari (es. UI)
  SLAYER_SUBROUTINE: Infinity, // Dura per tutta la partita
  CODE_INJECTOR: Infinity, // Dura per tutta la partita
  // DURATE PER I NUOVI POWER-UP
  BIT_VACUUM: 15, // NUOVO: Durata per il Bit Vacuum
  PURGE_PROTOCOL: 15, // NUOVO: Durata per il Purge Protocol
};

const POWER_UP_SPRITE_SCALE = 1.2;

export const POWERUP_CONFIGS = {
  [POWERUP_TYPE.TRIPLE_SHOT]: {
    src: 'images/powerups/tripleShotPowerUp.png',
    spriteKey: 'powerup_triple_shot',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
  [POWERUP_TYPE.SHIELD]: {
    src: 'images/powerups/shieldPowerUp.png',
    spriteKey: 'powerup_shield',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
  [POWERUP_TYPE.SMART_BOMB]: {
    src: 'images/powerups/bombPowerUp.png',
    spriteKey: 'powerup_smart_bomb',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
  [POWERUP_TYPE.DEBUG_MODE]: {
    src: 'images/powerups/powerUpDebugMode.png',
    spriteKey: 'powerup_debug_mode',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
  [POWERUP_TYPE.FIREWALL]: {
    src: 'images/powerups/powerUpFirewall.png',
    spriteKey: 'powerup_firewall',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
  [POWERUP_TYPE.BLOCK_BREAKER]: {
    src: 'images/powerups/powerUpBlockBreaker.png',
    spriteKey: 'powerup_block_breaker',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
  // NUOVE CONFIGURAZIONI PER POWER-UP PERMANENTI
  [POWERUP_TYPE.SLAYER_SUBROUTINE]: {
    src: 'images/powerups/slayerPowerUp.png', // ASSUNZIONE: percorso e nome file
    spriteKey: 'powerup_slayer_subroutine',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
  [POWERUP_TYPE.CODE_INJECTOR]: {
    src: 'images/powerups/codeInjectorPowerUp.png', // ASSUNZIONE: percorso e nome file
    spriteKey: 'powerup_code_injector',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
  [POWERUP_TYPE.REINFORCED_SHIELD]: {
    src: 'images/powerups/reinforced_shield_powerup.png', // Path per la nuova immagine del power-up
    spriteKey: 'powerup_reinforced_shield',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
  },
  [POWERUP_TYPE.MACHINE_LANGUAGE]: {
    src: 'images/powerups/machine_language_powerup.png', // Path per l'icona del power-up
    spriteKey: 'powerup_machine_language',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
  },
  // NUOVE CONFIGURAZIONI PER POWER-UP DI MODULO 6
  [POWERUP_TYPE.BIT_VACUUM]: {
    // NUOVO
    src: 'images/powerups/powerUpBitVacuum.png', // Placeholder, da sostituire con il tuo sprite
    spriteKey: 'powerup_bit_vacuum',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
  [POWERUP_TYPE.PURGE_PROTOCOL]: {
    // NUOVO
    src: 'images/powerups/powerUpPurgeProtocol.png', // Placeholder, da sostituire con il tuo sprite
    spriteKey: 'powerup_purge_protocol',
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 16,
    animationSpeed: 0.1,
  },
};

export class PowerUpItem {
  constructor(x, y, type, images) {
    this.type = type;
    this.config = POWERUP_CONFIGS[type];
    if (!this.config) {
      console.error(`Configurazione non trovata per power-up tipo: ${type}`);
      // Fallback config per evitare crash
      this.config = {
        frameWidth: 48,
        frameHeight: 48,
        numFrames: 1,
        animationSpeed: 0.1,
        spriteKey: 'playerProjectile', // Un fallback sprite esistente
      };
    }

    this.x = x;
    this.y = y;
    // Usa GLOBAL_SPRITE_SCALE_FACTOR importato
    this.width = this.config.frameWidth; // * GLOBAL_SPRITE_SCALE_FACTOR;
    this.height = this.config.frameHeight; // * GLOBAL_SPRITE_SCALE_FACTOR;

    this.sprite = images[this.config.spriteKey];
    this.animation = null;

    if (
      this.sprite &&
      this.sprite.complete &&
      this.sprite.naturalWidth > 0 &&
      this.config.numFrames > 1
    ) {
      this.animation = new SpriteAnimation(
        this.sprite,
        this.config.frameWidth,
        this.config.frameHeight,
        this.config.numFrames,
        this.config.animationSpeed || 0.1,
      );
    }

    // [FEAT] Testo per lo sprite del power-up
    // Assicurati che POWERUP_THEMATIC_NAMES sia accessibile. Se è in donkeyRunner.js,
    // dovresti importarlo o ridefinirlo qui. Per semplicità, lo definisco qui come fallback.
    const POWERUP_THEMATIC_NAMES_LOCAL = {
      [POWERUP_TYPE.TRIPLE_SHOT]: 'Multi-Thread',
      [POWERUP_TYPE.SHIELD]: 'Active Shield',
      [POWERUP_TYPE.SMART_BOMB]: 'System Cleanup',
      [POWERUP_TYPE.DEBUG_MODE]: 'Debug Payload',
      [POWERUP_TYPE.FIREWALL]: 'Solid Firewall',
      [POWERUP_TYPE.BLOCK_BREAKER]: 'Decompiler',
      [POWERUP_TYPE.SLAYER_SUBROUTINE]: 'Slayer Subroutine',
      [POWERUP_TYPE.CODE_INJECTOR]: 'Code Injector',
      [POWERUP_TYPE.REINFORCED_SHIELD]: 'Running Deprecated',
      [POWERUP_TYPE.MACHINE_LANGUAGE]: 'Machine Language',
      [POWERUP_TYPE.BIT_VACUUM]: 'Bit Vacuum Field',
      [POWERUP_TYPE.PURGE_PROTOCOL]: 'Purge Protocol',
    };
    this.text = (POWERUP_THEMATIC_NAMES_LOCAL[this.type] || 'POWER-UP').toUpperCase();
    this.textColor = '#F1FA8C'; // Giallo tenue (colore generico per power-up)
    this.fontSize = 14;
    this.textOffset = 0;
    this.textAnimationTimer = Math.random() * Math.PI * 2;
  }

  update(dt, gameSpeed) {
    this.x -= gameSpeed * dt;
    if (this.animation) {
      this.animation.update(dt);
    }
    // [FEAT] Aggiorna l'animazione verticale del testo
    this.textAnimationTimer += dt * 5;
    this.textOffset = Math.sin(this.textAnimationTimer) * 2;
  }

  draw(ctx) {
    const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;

    if (this.animation && spriteUsable) {
      const frame = this.animation.getFrame();
      ctx.drawImage(
        this.sprite,
        frame.sx,
        frame.sy,
        this.config.frameWidth,
        this.config.frameHeight,
        this.x,
        this.y,
        this.width,
        this.height,
      );
    } else if (spriteUsable) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = 'purple';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '10px monospace';
      ctx.fillText(this.type.slice(0, 3), this.x + this.width / 2, this.y + this.height / 2);
    }

    // [FEAT] Disegna il testo sopra lo sprite
    ctx.save();
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${this.fontSize}px "Courier Prime", monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.text, this.x + this.width / 2, this.y - 5 + this.textOffset);
    ctx.restore();
  }
}
