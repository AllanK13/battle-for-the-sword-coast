import { AudioManager } from './audio.js';

export function startEncounter(enemyDef, deck, rng, opts={}){
  const enemy = { ...enemyDef };
  // ensure a stable maxHp value is present (data uses `hp` as the base HP)
  if(typeof enemy.maxHp !== 'number') enemy.maxHp = typeof enemy.hp === 'number' ? enemy.hp : (enemy.maxHp || null);
  const state = {
    enemy,
    rng,
    deck,
    turn:0,
    apPerTurn: opts.apPerTurn || 3,
    ap: opts.apPerTurn || 3,
    playfield: [null,null,null], // 0,1 front; 2 back
    summons: [],
    exhaustedThisEncounter: [],
    summonUsed: {},
    summonCooldowns: {}
    ,pendingEffects: []
  };
  // All character cards should already be provided in `deck.hand` by the deck builder.
  // Drawing has been removed — no action needed here.
  return state;
}

function _selectSingleTargetIndex(state, rng){
  // prefer a hero marked by support 'Help'
  const helpedIndex = state.playfield.findIndex(h => h && h.helped);
  if(helpedIndex !== -1) return helpedIndex;
  // prefer front-line heroes (0,1)
  const front = [0,1].filter(i=>state.playfield[i]).map(i=>i);
  if(front.length>0) return rng ? front[rng.int(front.length)] : front[Math.floor(Math.random()*front.length)];
  // otherwise target the back slot (2) if present
  if(state.playfield[2]) return 2;
  return -1;
}

function parseDamageFromAbility(card){
  const nums = (card.ability||"").match(/(\d+)/g);
  if(!nums || nums.length === 0) return 0;
  // prefer the last numeric value in the ability text (handles "Cure Wounds (4th level): Restore 5 HP")
  return Number(nums[nums.length-1]);
}

// Healer helper: heals a single target or the whole party depending on
// the card's ability text or an explicit targetIndex of 'all'. Returns
// a result object similar to the previous playHeroAction heal return.
function resolveHeal(state, slotIndex, amount, targetIndex=null){
  const hero = state.playfield[slotIndex];
  if(!hero) return { success:false, reason:'no hero' };
  const abilityText = (hero.base && hero.base.ability) ? hero.base.ability.toLowerCase() : '';
  const isParty = (targetIndex === 'all') || /all|party|everyone|entire/i.test(abilityText) || (hero.base && hero.base.actionTarget === 'party');
  const healAmount = Number(amount) || 1;
  if(isParty){
    const healedSlots = [];
    state.playfield.forEach((h,i)=>{ if(h){ const before = h.hp; h.hp = Math.min(h.base.hp, h.hp + healAmount); const healed = h.hp - before; if(healed>0) healedSlots.push({ slot:i, healed, hp: h.hp }); } });
    state.ap -= 1;
    return { success:true, type:'heal', healed: healAmount, targets: healedSlots };
  }
  const targetSlot = (typeof targetIndex === 'number' && state.playfield[targetIndex]) ? state.playfield[targetIndex] : hero;
  const before = targetSlot.hp;
  targetSlot.hp = Math.min(targetSlot.base.hp, targetSlot.hp + healAmount);
  state.ap -= 1;
  const healed = targetSlot.hp - before;
  const slot = state.playfield.findIndex(h=>h===targetSlot);
  return { success:true, type:'heal', healed, slot, hp: targetSlot.hp };
}

// Centralized single-target attack resolution. Picks a target using
// `_selectSingleTargetIndex`, applies temp HP / defending logic, mutates
// state, and returns an array of event objects suitable for the UI.
function resolveSingleTargetAttack(state, dmg, attackIndex, attackName){
  const events = [];
  const idx = _selectSingleTargetIndex(state, state.rng);
  if(idx !== -1){
    const h = state.playfield[idx];
    if(h){
      let remaining = h.defending ? 0 : dmg;
      let tempTaken = 0;
      if(h.tempHp && h.tempHp>0){ const take = Math.min(h.tempHp, remaining); h.tempHp -= take; tempTaken = take; remaining -= take; }
      let hpTaken = 0;
      if(remaining>0){ h.hp -= remaining; hpTaken = remaining; }
      const died = h.hp <= 0;
      const heroName = h.base && h.base.name ? h.base.name : null;
      if(died){ state.exhaustedThisEncounter.push(h.base); state.playfield[idx] = null; }
      const ev = { type:'hit', slot: idx, dmg: dmg, tempTaken, hpTaken, remainingHp: died?0:h.hp, died, heroName };
      // mark event with attack type for UI/audio handling
      ev.attackType = 'single';
      if(typeof attackIndex === 'number') ev.attack = attackIndex+1;
      if(attackName) ev.attackName = attackName;
      events.push(ev);
    }
  }
  return events;
}

// Centralized AOE attack resolution. Applies the AOE damage rules used
// throughout the file (base damage halved, defending halves again),
// mutates state, and returns an array of events.
function resolveAoEAttack(state, baseDmg, attackIndex, attackName){
  const events = [];
  for(let i=0;i<state.playfield.length;i++){
    const h = state.playfield[i];
    if(h){
      let remaining = Math.ceil(baseDmg/2);
      if(h.defending) remaining = Math.ceil(remaining/2);
      let tempTaken = 0;
      if(h.tempHp && h.tempHp>0){ const take = Math.min(h.tempHp, remaining); h.tempHp -= take; tempTaken = take; remaining -= take; }
      let hpTaken = 0;
      if(remaining>0){ h.hp -= remaining; hpTaken = remaining; }
      const died = h.hp <= 0;
      const heroName = h.base && h.base.name ? h.base.name : null;
      if(died){ state.exhaustedThisEncounter.push(h.base); state.playfield[i] = null; }
      const ev = { type:'hit', slot: i, dmg: baseDmg, tempTaken, hpTaken, remainingHp: died?0:h.hp, died, heroName };
      // mark event with attack type for UI/audio handling
      ev.attackType = 'aoe';
      if(typeof attackIndex === 'number') ev.attack = attackIndex+1;
      if(attackName) ev.attackName = attackName;
      events.push(ev);
    }
  }
  return events;
}

// Unified placeHero: either place into specified slot or into first empty slot.
// If called as placeHero(state, slotIndex, card) it will attempt that slot.
// If called as placeHero(state, card) it will place into the first empty slot (prefers 0,1 then 2).
// Placing into an empty slot does NOT cost AP. The placed card is removed from `state.deck.hand` if present.
export function placeHero(state, slotIndex, card){
  // Require explicit slotIndex; do not auto-place. Caller/UI should prompt for slot.
  if(card == null) return { success:false, reason:'no card' };
  if(typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex >= state.playfield.length) return { success:false, reason:'invalid slot' };
  if(state.playfield[slotIndex] !== null) return { success:false, reason:'slot occupied' };
  const hero = { cardId: card.id, hp: card.hp, base: card, tempHp: 0 };
  state.playfield[slotIndex] = hero;
  // remove one copy from hand if present
  try{
    if(state.deck && Array.isArray(state.deck.hand)){
      const idx = state.deck.hand.findIndex(c=> c && c.id === card.id);
      if(idx !== -1) state.deck.hand.splice(idx,1);
    }
  }catch(e){ /* ignore hand removal failures */ }
  return { success:true, slot: slotIndex };
}

export function playHeroAttack(state, slotIndex){
  if(state.ap <= 0) return { success:false, reason:'no AP' };
  const hero = state.playfield[slotIndex];
  if(!hero) return { success:false, reason:'no hero' };
  const baseDmg = parseDamageFromAbility(hero.base);
  const mult = state.nextAttackMultiplier || 1;
  const dmg = Math.floor(baseDmg * mult);
  state.enemy.hp -= dmg;
  // reset multiplier if it was applied
  if(mult !== 1) state.nextAttackMultiplier = 1;
  state.ap -= 1;
  return { success:true, type: 'attack', dmg, enemyHp: state.enemy.hp };
}

export function playHeroAction(state, slotIndex, targetIndex=null){
  // generic action: attack or heal based on card ability text
  if(state.ap <= 0) return { success:false, reason:'no AP' };
  const hero = state.playfield[slotIndex];
  if(!hero) return { success:false, reason:'no hero' };
  const ability = (hero.base && hero.base.ability) ? hero.base.ability.toLowerCase() : '';
  const amount = parseDamageFromAbility(hero.base);
  // Determine explicit action type: prefer `actionType` then parse ability text.
  // Normalize to one of: 'dps', 'healer', 'support'. Default -> 'dps'.
  let actionType = (hero.base && hero.base.actionType) ? String(hero.base.actionType).toLowerCase() : null;
  if(!actionType){
    if(/heal|cure|restore|regen|heals?/i.test(ability)) actionType = 'healer';
    else actionType = 'dps';
  }
  // DPS: delegate to the existing attack function which handles AP and multiplier
  if(actionType === 'dps' || actionType === 'attack'){
    return playHeroAttack(state, slotIndex);
  }
  // Healer: use the centralized resolveHeal helper (handles party or single-target heals)
  if(actionType === 'healer' || actionType === 'heal'){
    return resolveHeal(state, slotIndex, amount, targetIndex);
  }
  // Support: explicit id-based handling for support heroes (add more branches as needed)
  if(actionType === 'support'){
    // Shalendra: refresh Volo's summon availability for this encounter
    if (hero.base && hero.base.id === 'shalendra') {
      if (!state.summonUsed) state.summonUsed = {};
      state.summonUsed['volo'] = false;
      if (!state.summonCooldowns) state.summonCooldowns = {};
      state.summonCooldowns['volo'] = 0;
      state.ap -= 1;
      return { success:true, type:'support', slot: slotIndex, id:'shalendra', refreshed: 'volo' };
    }

    // Piter: special help action (marks this hero as helped for enemy single-target selection)
    if (hero.base && hero.base.id === 'piter'){
      hero.helped = true;
      hero.helpSource = 'piter';
      state.ap -= 1;
      return { success:true, type:'support', slot: slotIndex, id:'piter' };
    }

    // Lumalia: schedule a delayed damage effect that triggers after the enemy turn
    if (hero.base && hero.base.id === 'lumalia'){
      state.pendingEffects = state.pendingEffects || [];
      state.pendingEffects.push({ type: 'delayedDamage', id: 'lumalia', slot: slotIndex, dmg: 6, trigger: 'afterEnemy', sourceName: (hero.base && hero.base.name) ? hero.base.name : 'Lumalia' });
      state.ap -= 1;
      return { success:true, type:'support', slot: slotIndex, id:'lumalia', scheduled: true };
    }

    // Default support: no implicit behavior. Unknown support actions do nothing.
    return { success:false, reason:'no support action' };
  }

  // Unknown/unsupported action types do nothing
  return { success:false, reason:'unsupported actionType' };
}

export function defendHero(state, slotIndex){
  if(state.ap <= 0) return { success:false, reason:'no AP' };
  const hero = state.playfield[slotIndex];
  if(!hero) return { success:false, reason:'no hero' };
  // mark hero as defending for the upcoming enemy action
  hero.defending = true;
  state.ap -= 1;
  return { success:true };
}

export function replaceHero(state, slotIndex, newCard){
  const old = state.playfield[slotIndex];
  // If the slot is empty, placing the hero should be free (no AP cost).
  if(!old){
    state.playfield[slotIndex] = { cardId: newCard.id, hp: newCard.hp, base: newCard };
    return { success:true, slot: slotIndex };
  }
  // Replacement of an occupied slot costs AP.
  if(state.ap <= 0) return { success:false, reason:'no AP' };
  if(old){
    // Return the replaced character card back into the player's hand so it can be reused
    // during the remainder of the encounter (killed heroes remain removed).
    try{
      if(state.deck && Array.isArray(state.deck.hand)){
        // clone the base card but preserve current HP so returned card keeps damage taken
        const returned = Object.assign({}, old.base, { hp: old.hp });
        state.deck.hand.push(returned);
      }
    }catch(e){ /* ignore */ }
  }
  state.playfield[slotIndex] = { cardId: newCard.id, hp: newCard.hp, base: newCard };
  state.ap -= 1;
  return { success:true };
}

export function endPlayerTurn(state){
  // end of player turn: enemy will act next. drawing is performed after enemy act
  // so the player receives a card at the start of their next turn.
}

export function enemyAct(state){
  state.turn++;
  // check stunned
  if(state.enemy.stunnedTurns && state.enemy.stunnedTurns>0){
    state.enemy.stunnedTurns--;
    // skip action
    state.ap = state.apPerTurn;
    // decrement summon cooldowns
    Object.keys(state.summonCooldowns).forEach(k=>{
      if(state.summonCooldowns[k] > 0) state.summonCooldowns[k]--;
    });
    return { did:'enemyStunned', events:[{type:'stunned', msg:'Enemy stunned and skipped its turn'}] };
  }
  // simple AI: choose single-target vs AOE randomly
  const rng = state.rng;
  const isAOE = rng ? (rng.int(2)===0) : (Math.random() < 0.3);
  const dmg = state.enemy.attack || 1;
  const events = [];
  if(state.enemy && Array.isArray(state.enemy.attacks) && state.enemy.attacks.length>0){
    const picks = state.enemy.attacks;
    const atkIndex = rng ? rng.int(picks.length) : Math.floor(Math.random()*picks.length);
    const atk = picks[atkIndex] || {};
    const attackName = atk.name || ('Attack '+(atkIndex+1));
    const type = (atk.type || 'single').toLowerCase();
    const baseDmg = (typeof atk.dmg === 'number') ? atk.dmg : (state.enemy.attack || 1);
    // Use centralized handlers for both AOE and single-target attacks
    if(type === 'aoe'){
      events.push(...resolveAoEAttack(state, baseDmg, atkIndex, attackName));
    } else {
      events.push(...resolveSingleTargetAttack(state, baseDmg, atkIndex, attackName));
    }
    // after performing the attack(s), fall through to common end-of-turn housekeeping
    // (events have been populated above)
  }
  // No data-driven `attacks` defined: do not perform legacy fallback attacks.
  // Advance turn housekeeping and return empty events — enemy cannot act.
  state.ap = state.apPerTurn;
  Object.keys(state.summonCooldowns).forEach(k=>{ if(state.summonCooldowns[k] > 0) state.summonCooldowns[k]--; });
  state.playfield.forEach(h=>{ if(h && h.defending) h.defending = false; });
  state.playfield.forEach(h=>{ if(h && h.helped) h.helped = false; });
  // Process any pendingEffects that should trigger after the enemy acted
  if(state.pendingEffects && Array.isArray(state.pendingEffects) && state.pendingEffects.length>0){
    const remaining = [];
    state.pendingEffects.forEach(eff=>{
      if(eff && eff.trigger === 'afterEnemy'){
        if(eff.type === 'delayedDamage'){
          const dmg = Number(eff.dmg) || 0;
          state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
          events.push({ type: 'enemyDamage', id: eff.id, slot: eff.slot, dmg: dmg, enemyHp: state.enemy.hp, sourceName: eff.sourceName });
        }
        // do not keep after triggered
      } else {
        remaining.push(eff);
      }
    });
    state.pendingEffects = remaining;
  }
  // drawing removed — cards remain static in `deck.hand` for duration of encounter
  return {did:'enemyAct', events};
}


export function useSummon(state, summonDef, targetIndex=null){
  if(!summonDef || !summonDef.id) return { success:false, reason:'invalid' };
  const id = summonDef.id;
  // check once-per-encounter restriction (only blocks within this encounter)
  if(summonDef.restriction && summonDef.restriction.toLowerCase().includes('once per encounter')){
    if(state.summonUsed[id]) return { success:false, reason:'used' };
  }
  // check cooldown
  const cd = state.summonCooldowns[id] || 0;
  if(cd > 0) return { success:false, reason:'cooldown' };
  // Concrete effects by known summon ids
  if(id === 'garon'){
    // heal entire party 1 HP
    state.playfield.forEach(h=>{ if(h) h.hp = Math.min(h.base.hp, h.hp + 1); });
  } 
  else if(id === 'volo'){
    // double next attack
    state.nextAttackMultiplier = 2;
  } 
  else if(id === 'blackrazor'){
    // give 30 temp HP to a target (if provided) or lowest-HP hero
    const heroes = state.playfield;
    if(!heroes.some(h=>h)) return { success:false, reason:'no_target' };
    let target = null;
    if(targetIndex !== null && heroes[targetIndex]) target = heroes[targetIndex];
    else target = heroes.filter(h=>h).reduce((a,b)=> (a.hp < b.hp ? a : b));
    if(!target) return { success:false, reason:'no_target' };
    target.tempHp = (target.tempHp||0) + 30;
  } 
  else if(id === 'whelm'){
    // stun enemy for 2 turns (ensure at least 2)
    state.enemy.stunnedTurns = Math.max(2, state.enemy.stunnedTurns||0);
  } 
  else if(id === 'wave'){
    // reduce enemy HP by 50% of max
    const max = state.enemy.maxHp || state.enemy.hp;
    const reduce = Math.floor((max * 0.5));
    state.enemy.hp = Math.max(0, state.enemy.hp - reduce);
    try{ AudioManager.playSfx(['./assets/sfx/wave.mp3'], { volume: 2.0 }); }catch(e){}
  } 
  else {
    // fallback: try to parse numeric heal
    const m = (summonDef.ability||'').match(/(\d+)/);
    const v = m ? Number(m[1]) : null;
    if(v){ state.playfield.forEach(h=>{ if(h) h.hp = Math.min(h.base.hp, h.hp + v); }); }
  }
  // mark used or set cooldown
  if(summonDef.restriction && summonDef.restriction.toLowerCase().includes('once per encounter')){
    state.summonUsed[id] = true;
    state.summonCooldowns[id] = 9999;
  } else if(summonDef.restriction && summonDef.restriction.toLowerCase().includes('once per run')){
    // mark used for this encounter (persistent run-level tracking handled by caller)
    state.summonUsed[id] = true;
    state.summonCooldowns[id] = 9999;
  } else if(summonDef.cooldown){
    state.summonCooldowns[id] = summonDef.cooldown;
  }
  return { success:true };
}

export function isFinished(state){
  if(state.enemy.hp<=0) return { winner: 'player' };
  // lose if no heroes on field and no cards in hand/draw?
  const anyHeroes = state.playfield.some(s=>s!==null);
  if(!anyHeroes){
    // only consider the run lost if at least one enemy turn has occurred
    // (i.e., after the first round). This prevents immediate loss on initial empty field.
    if(state.turn && state.turn > 0) return { winner: 'enemy' };
    return { winner: null };
  }
  return { winner: null };
}

