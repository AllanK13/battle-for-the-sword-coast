// Common helper utilities for the card game
// Extracted to reduce redundancy across main.js, encounter.js, and battle.js

import { AudioManager } from './audio.js';

// Music path helpers
export function getMusicPaths(filename) {
  return [
    `./assets/music/${filename}`,
    `assets/music/${filename}`,
    `/assets/music/${filename}`
  ];
}

export function getSfxPaths(filename) {
  return [
    `./assets/sfx/${filename}`,
    `assets/sfx/${filename}`,
    `/assets/sfx/${filename}`
  ];
}

// Name extraction helpers
export function getHeroName(hero, slotIndex = null) {
  if (!hero) return slotIndex !== null ? `Hero ${slotIndex + 1}` : 'Hero';
  if (hero.base && hero.base.name) return hero.base.name;
  if (hero.name) return hero.name;
  return slotIndex !== null ? `Hero ${slotIndex + 1}` : 'Hero';
}

export function getEnemyName(enemy) {
  if (!enemy) return 'Enemy';
  return enemy.name || enemy.id || 'Enemy';
}

export function getEnemyKey(enemy) {
  if (!enemy) return 'unknown';
  return enemy.id || enemy.name || 'unknown';
}

export function getHeroId(hero) {
  if (!hero) return null;
  if (hero.base && hero.base.id) return hero.base.id;
  return hero.cardId || null;
}

// Initialize music with standard settings
export function initMusic(filename, opts = { autoplay: true, loop: true }) {
  try {
    const musicCandidates = getMusicPaths(filename);
    AudioManager.init(musicCandidates[0], opts);
  } catch (e) {
    // ignore audio init failures
  }
}

// State handler helpers
export function disableStateHandlers(ctx) {
  if (!ctx) return { prevOnState: null, prevSetMessage: null };
  const prevOnState = ctx.onStateChange;
  const prevSetMessage = ctx.setMessage;
  ctx.onStateChange = () => {};
  ctx.setMessage = () => {};
  return { prevOnState, prevSetMessage };
}

export function restoreStateHandlers(ctx, prevOnState, prevSetMessage) {
  if (!ctx) return;
  ctx.onStateChange = typeof prevOnState === 'function' ? prevOnState : (()=>{});
  ctx.setMessage = typeof prevSetMessage === 'function' ? prevSetMessage : (()=>{});
}

// Meta save helpers
export function shouldSaveToGlobal(ctx) {
  return !ctx || !ctx.isAdventure;
}

export function updateMetaStat(meta, statName, value, ctx) {
  if (shouldSaveToGlobal(ctx)) {
    meta[statName] = value;
  } else {
    ctx.meta = ctx.meta || {};
    ctx.meta[statName] = value;
  }
}

export function updateEnemyCount(meta, enemyKey, countType, ctx) {
  const countKey = countType === 'enemyDefeatCounts' ? 'enemyDefeatCounts' : 'enemyVictoryCounts';
  
  if (shouldSaveToGlobal(ctx)) {
    meta[countKey] = meta[countKey] || {};
    meta[countKey][enemyKey] = (meta[countKey][enemyKey] || 0) + 1;
  } else {
    ctx.meta = ctx.meta || {};
    ctx.meta[countKey] = ctx.meta[countKey] || {};
    ctx.meta[countKey][enemyKey] = (ctx.meta[countKey][enemyKey] || 0) + 1;
  }
}

// Debounced save state for enemyLowestHP updates
let _pendingSave = null;
let _saveTimer = null;

// Optimized update for per-enemy lowest HP tracking
// Only updates if hp is actually lower than existing, and debounces saves
export function updateEnemyLowestHP(meta, enemy, hp, ctx) {
  if (!meta || !enemy) return;
  const enemyKey = getEnemyKey(enemy);
  if (!enemyKey || enemyKey === 'unknown') return;
  
  // Record the observed HP value (allow negatives)
  const observedHP = Number(hp);
  if (Number.isNaN(observedHP)) return;

  // Short-circuit: only update if this is actually lower
  const existing = meta.enemyLowestHP?.[enemyKey];
  if (existing !== undefined && observedHP >= existing) return;

  // Update the stat (store observed HP, may be negative)
  if (!meta.enemyLowestHP) meta.enemyLowestHP = {};
  meta.enemyLowestHP[enemyKey] = observedHP;
  
  // Mark dirty and schedule debounced save
  meta.__dirty = true;
  _pendingSave = { meta, ctx };
  
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    if (_pendingSave && _pendingSave.meta.__dirty) {
      try {
        const { saveMetaIfAllowed } = require('./meta.js');
        saveMetaIfAllowed(_pendingSave.meta, _pendingSave.ctx);
        _pendingSave.meta.__dirty = false;
      } catch (e) {
        // ignore save errors
      }
    }
    _pendingSave = null;
    _saveTimer = null;
  }, 500); // 500ms debounce
}

// Force flush any pending enemyLowestHP saves (call at end-of-encounter or critical saves)
export function flushEnemyLowestHP() {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  if (_pendingSave && _pendingSave.meta.__dirty) {
    try {
      const { saveMetaIfAllowed } = require('./meta.js');
      saveMetaIfAllowed(_pendingSave.meta, _pendingSave.ctx);
      _pendingSave.meta.__dirty = false;
    } catch (e) {
      // ignore
    }
  }
  _pendingSave = null;
}

// Try-catch wrapper for safer operations
export function safeCall(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

// Ability helpers
export function getAbilityApCost(ability) {
  if (!ability) return 1;
  if (typeof ability.ap_cost === 'number') return ability.ap_cost;
  if (typeof ability.apCost === 'number') return ability.apCost;
  return 1;
}

export function getAbilityCooldown(ability, defaultCd = 0) {
  if (!ability) return defaultCd;
  if (typeof ability.cooldown === 'number') return ability.cooldown;
  return defaultCd;
}

// Build a unique key for per-hero-instance ability cooldowns
export function buildAbilityCooldownKey(hero, slotIndex, abilityIndex) {
  const inst = (hero && hero.cardId) ? hero.cardId : String(slotIndex);
  const aiKey = typeof abilityIndex === 'number' ? String(abilityIndex) : 'primary';
  return `${inst}:ability${aiKey}`;
}
