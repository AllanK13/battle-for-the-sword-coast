// Encounter-specific helper utilities
// Attack resolution, damage application, and hero management helpers

// Helper to extract the primary ability object from a card definition
export function getPrimaryAbility(obj) {
  if (!obj) return {};
  try {
    if (Array.isArray(obj.abilities) && obj.abilities.length > 0) {
      return obj.abilities.find(a => a.primary) || obj.abilities[0] || {};
    }
  } catch (e) {}
  // fallback to legacy top-level fields if present
  return {
    ability: obj.ability,
    actionType: obj.actionType,
    hitChance: obj.hitChance,
    critChance: obj.critChance,
    type: obj.type
  };
}

// Parse damage value from ability text
export function parseDamageFromAbility(card) {
  const abilityObj = (card && typeof card === 'object' && (card.ability || card.abilities)) ? card : {};
  const text = (abilityObj.ability || (card && card.ability) || "") + "";
  const nums = (text || "").match(/(\d+)/g);
  if (!nums || nums.length === 0) return 0;
  // prefer the last numeric value in the ability text
  return Number(nums[nums.length - 1]);
}

// Apply damage to hero with temp HP logic
export function applyDamageToHero(hero, dmg) {
  let remaining = dmg;
  let tempTaken = 0;
  
  if (hero.tempHp && hero.tempHp > 0) {
    const take = Math.min(hero.tempHp, remaining);
    hero.tempHp -= take;
    tempTaken = take;
    remaining -= take;
  }
  
  let hpTaken = 0;
  if (remaining > 0) {
    hero.hp -= remaining;
    hpTaken = remaining;
  }
  
  return { tempTaken, hpTaken, totalTaken: tempTaken + hpTaken };
}

// Handle hero death (exhaust and clear slot)
export function killHero(state, slotIndex) {
  const hero = state.playfield[slotIndex];
  if (!hero) return false;
  
  state.exhaustedThisEncounter.push(hero.base);
  state.playfield[slotIndex] = null;
  return true;
}

// Create a hit event object (standardized structure)
export function createHitEvent(hero, slotIndex, dmgInfo, attackIndex = null, attackName = null, attackType = 'single') {
  const died = hero.hp <= 0;
  const heroName = hero.base?.name || hero.name || null;
  
  const ev = {
    type: 'hit',
    slot: slotIndex,
    dmg: dmgInfo.totalTaken || 0,
    tempTaken: dmgInfo.tempTaken || 0,
    hpTaken: dmgInfo.hpTaken || 0,
    remainingHp: died ? 0 : hero.hp,
    died,
    heroName,
    attackType
  };
  
  if (typeof attackIndex === 'number') ev.attack = attackIndex + 1;
  if (attackName) ev.attackName = attackName;
  
  return ev;
}

// Create a protected event (no damage taken due to protection)
export function createProtectedEvent(hero, slotIndex, attackIndex = null, attackName = null, attackType = 'single') {
  const heroName = hero.base?.name || hero.name || null;
  
  const ev = {
    type: 'hit',
    slot: slotIndex,
    dmg: 0,
    tempTaken: 0,
    hpTaken: 0,
    remainingHp: hero.hp,
    died: false,
    heroName,
    protected: true,
    attackType
  };
  
  if (typeof attackIndex === 'number') ev.attack = attackIndex + 1;
  if (attackName) ev.attackName = attackName;
  
  return ev;
}

// Check if hero should be immune due to formation
export function isHeroImmuneToAoE(state, slotIndex) {
  try {
    if (Number(state.formation) === 3 && slotIndex === 2) {
      return true; // Formation 3 backline is immune to AoE
    }
  } catch (e) {}
  return false;
}

// RNG helpers with state fallback
export function rollRandom(state) {
  try {
    if (state?.rng?.rand) return state.rng.rand();
  } catch (e) {}
  return Math.random();
}

export function checkHit(state, chance) {
  const c = typeof chance === 'number' ? chance : 1.0;
  return rollRandom(state) < c;
}

export function checkCrit(state, chance) {
  const c = typeof chance === 'number' ? chance : 0.0;
  return rollRandom(state) < c;
}

// Get selected ability from hero (handles explicit abilityIndex)
export function getSelectedAbility(hero, abilityIndex = null) {
  if (typeof abilityIndex === 'number' && hero?.base?.abilities?.[abilityIndex]) {
    return hero.base.abilities[abilityIndex];
  }
  return getPrimaryAbility(hero?.base);
}

// Calculate final hit chance (includes blind penalty)
export function calculateHitChance(hero, baseHitChance) {
  let hitChance = typeof baseHitChance === 'number' ? baseHitChance : 1.0;
  
  // Apply hit bonus (e.g., from Assist)
  if (hero?.hitBonus && typeof hero.hitBonus === 'number') {
    hitChance = Math.min(1.0, hitChance + hero.hitBonus);
  }
  
  // Apply blind penalty
  if (hero?.blindedTurns && hero.blindedTurns > 0) {
    hitChance = hitChance * 0.5;
  }
  
  return hitChance;
}

// Calculate final damage (includes enfeeble penalty, crit multiplier)
export function calculateFinalDamage(hero, baseDmg, isCrit, multiplier = 1) {
  let dmg = Math.floor(baseDmg * multiplier * (isCrit ? 2 : 1));
  
  // Apply enfeeble penalty (half physical damage)
  if (hero?.enfeebledTurns && hero.enfeebledTurns > 0) {
    dmg = Math.floor(dmg / 2);
  }
  
  return dmg;
}
