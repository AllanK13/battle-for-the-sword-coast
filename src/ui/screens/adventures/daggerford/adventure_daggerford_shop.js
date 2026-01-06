import { el } from '../../../renderer.js';
import { navigate } from '../../../router.js';
import { initMusic, disableStateHandlers, restoreStateHandlers } from '../../../../engine/helpers.js';
import { saveMetaIfAllowed, loadAdventureTemp, saveAdventureTemp } from '../../../../engine/meta.js';
import { splitNarrative } from '../text_split.js';
import { addMusicControls } from '../../../music-controls.js';
import { attachCinematicAdvance } from '../cinematic.js';
import { getNextStep, advanceAdventureStep } from '../../../../engine/adventure-flow.js';

export function renderDaggerfordShop(root, params = {}){
  // Normalize incoming ctx: some callers accidentally pass a session object
  // that contains a `ctx` property (e.g., { ctx: { ctx: { ... } } }). Handle
  // that case by unwrapping one level so downstream code sees the real ctx.
  let inCtx = (params && params.ctx) ? params.ctx : {};
  try{
    if(inCtx && inCtx.ctx && (!inCtx.data || Object.keys(inCtx.data).length === 0)){
      // unwrap wrapper objects that used the session directly
      inCtx = inCtx.ctx;
    }
  }catch(e){}
  try{ if((!inCtx || !inCtx.data) && params && params.data) inCtx.data = params.data; }catch(e){}
  const ctx = inCtx;
  
  // Disable state handlers during shop screen
  const { prevOnState, prevSetMessage } = disableStateHandlers(ctx);
  if (ctx) ctx._cinematicActive = true;
  
  try{ initMusic('town.mp3'); }catch(e){}

  const container = el('div',{class:'adventure-cinematic', style:'position:relative;width:100%;height:100%;background:transparent;overflow:visible;color:#fff;display:flex;align-items:center;justify-content:center'},[]);

  const bg = el('img',{src:'assets/adventure/shop.png', alt:'Daggerford Shop', style:'position:absolute;left:50%;top:0;width:120vw;height:100vh;object-fit:auto;object-position:center top;transform-origin:top center;transform:translateX(-50%) scale(1.06);opacity:0;transition:opacity 4200ms ease, transform 4200ms ease'});
  bg.addEventListener('error', ()=>{ bg.src='assets/adventure/shop.png'; });
  bg.addEventListener('load', ()=>{ try{ const w = bg.naturalWidth || 1200; const h = bg.naturalHeight || 800; bg.style.width = w + 'px'; bg.style.height = h + 'px'; }catch(e){} });
  container.appendChild(bg);
  setTimeout(()=>{ try{ bg.style.opacity = '1'; bg.style.transform = 'translateX(-50%) scale(1.08)'; }catch(e){} }, 120);

  const overlay = el('div',{style:'position:absolute;left:0;top:0vh;width:100%;height:100%;z-index:6;pointer-events:none;opacity:0;transition:opacity 1200ms ease;background:linear-gradient(rgba(0, 0, 0, 0.85), rgba(0,0,0,0.85) 100%)'},[]);
  container.appendChild(overlay);
  setTimeout(()=>{ try{ overlay.style.opacity = '1'; }catch(e){} }, 2200);
  // Show purchase UI when overlay appears
  setTimeout(()=>{ try{ purchaseWrap.style.opacity = '1'; }catch(e){} }, 2200);

  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:1000px;width:90%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:0vh;pointer-events:none'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  const text = `
“Sorry I don’t have much left, some adventurers just came through here and practically cleaned me out. |
They said they were heading to clear out some twig blights, sounds awfully dangerous. |
Anyways, here’s what I’ve got left."`;
  const sentences = splitNarrative(text, '|');
  const pEls = sentences.map(s => { const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]); inner.appendChild(p); return p; });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

  // Attach left-click advancement helper
  attachCinematicAdvance(container, pEls, { onComplete: ()=>{ try{ if(typeof revealButtons === 'function') revealButtons(); }catch(e){} } });

  function startReveal(){ let totalDelay = 0; pEls.forEach((p, idx) => { const base = 700; const extra = Math.min(2000, (p.textContent.length || 0) * 12); const revealDelay = base + extra; totalDelay += revealDelay; setTimeout(()=>{ try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){} if(idx === pEls.length - 1){ setTimeout(revealButtons, 900); } }, totalDelay); totalDelay += 300; }); if(pEls.length === 0) revealButtons(); }

  function revealButtons(){ continueBtn.style.display = 'inline-block'; }

  // Purchase UI (fades in with overlay)
  const purchaseWrap = el('div',{style:'position:relative;z-index:10040;display:flex;gap:12px;align-items:center;justify-content:center;flex-direction:column;opacity:0;transition:opacity 1200ms ease;'},[]);
  // Gold display above buttons
  const goldDisplay = el('div',{style:'min-width:160px;text-align:center;color:#ffd54f;font-weight:700;font-size:20px;margin-bottom:8px;'},['Gold: 0g']);
  purchaseWrap.appendChild(goldDisplay);
  // Row: Potion buttons side by side
  const row = el('div',{style:'display:flex;align-items:center;gap:12px'},[]);
  const healBtn = el('button',{class:'choice-action-btn', style:'padding:10px 14px;font-size:16px'},['Potion of Healing (3g)']);
  const speedBtn = el('button',{class:'choice-action-btn', style:'padding:10px 14px;font-size:16px'},['Potion of Speed (3g)']);
  row.appendChild(healBtn); row.appendChild(speedBtn);
  purchaseWrap.appendChild(row);

  const continueBtn = el('button',{class:'choice-action-btn', style:'display:none;z-index:10040;position:fixed;left:50%;transform:translateX(-50%);bottom:18px'},['Fight Szass Tam']);
  continueBtn.addEventListener('click', async ()=>{ 
    try{ 
      AudioManager.playSfx(['./assets/music/boom.mp3','assets/music/boom.mp3'], { volume: 0.6 }); 
    }catch(e){}
    
    // Restore handlers and clear cinematic flag before battle
    try{ restoreStateHandlers(ctx, prevOnState, prevSetMessage); }catch(e){}
    if (ctx) ctx._cinematicActive = false;
    
    try{
      // Validate we have the necessary data
      if(!ctx || !ctx.data || !ctx.data.enemies){
        console.error('Missing ctx.data.enemies - cannot start battle', { ctx, params });
        // Try a minimal fallback: use `window.__appData` if the host page exposed it.
        try{ if(typeof window !== 'undefined' && window.__appData && !ctx.data) ctx.data = window.__appData; }catch(e){}
        if(!ctx || !ctx.data || !ctx.data.enemies){
          // Inform player non-technically and return to adventure start.
          alert('Missing adventure data; returning to Adventure Start.');
          navigate('adventure_start');
          return;
        }
      }
      // Start battle against Szass Tam
      const szassTam = ctx.data.enemies.find(e => e && e.id === 'szass_tam_daggerford_adventure');
      if(szassTam){
        // Enable legendary summons for the final boss fight
        try{ ctx.disableLegendarySummons = false; }catch(e){}
        
        // Prepare encounter for Szass Tam using existing encounter object (mutate to preserve closures)
        const { createRNG } = await import('../../../../engine/rng.js');
        const { buildDeck } = await import('../../../../engine/deck.js');
        const rng = createRNG();
        const legendaryCards = (ctx.data.legendary || []).filter(l => l && typeof l.hp === 'number');
        const cardDefs = (ctx.data.cards || []).concat(legendaryCards);
        // Use meta.ownedCards to include any cards earned during the adventure (Whelm, etc.)
        const chosen = (ctx.meta && Array.isArray(ctx.meta.ownedCards)) ? ctx.meta.ownedCards : [];
        
        const deck = buildDeck(cardDefs, chosen, rng);
        try{
          const enc = ctx.encounter || {};
          enc.enemy = { ...szassTam };
          if(typeof enc.enemy.maxHp !== 'number') enc.enemy.maxHp = typeof enc.enemy.hp === 'number' ? enc.enemy.hp : (enc.enemy.maxHp || null);
          enc.rng = rng;
          enc.deck = deck;
          enc.turn = 0;
          enc.apPerTurn = (ctx.meta && ctx.meta.apPerTurn) ? ctx.meta.apPerTurn : 3;
          enc.ap = enc.apPerTurn;
          enc.playfield = [null,null,null];
          enc.summons = [];
          enc.exhaustedThisEncounter = [];
          enc.summonUsed = {};
          enc.summonCooldowns = {};
          enc.supportUsed = {};
          enc.abilityCooldowns = {};
          enc.pendingEffects = [];
          enc._nextHeroInstanceId = enc._nextHeroInstanceId || 1;
          ctx.encounter = enc;
        }catch(e){ console.error('Failed to prepare Szass Tam encounter', e); }

        // Clear any leftover enemy sequence
        try{ if(ctx && Array.isArray(ctx.enemySequence)) ctx.enemySequence = []; }catch(e){}

        // Ensure adventure flow advances so the next step is the Szass Tam battle.
        try{
          const next = getNextStep(ctx);
          if(next && next.type === 'battle'){
            try{ advanceAdventureStep(ctx); }catch(e){}
          }
        }catch(e){ console.error('Failed to advance adventure step before battle', e); }

        navigate('battle', ctx);
      } else {
        console.error('Szass Tam not found in enemies data');
        navigate('menu');
      }
    }catch(e){ 
      console.error('Error starting battle:', e); 
      try{ navigate('menu'); }catch(e2){} 
    } 
  });
  purchaseWrap.appendChild(continueBtn);
  container.appendChild(purchaseWrap);

  // Initialize meta fields defensively
  try{ 
    ctx.meta = ctx.meta || {}; 
    // Preserve the current adventure progress before loading saved state
    const currentProgress = ctx.meta.adventureProgress;
    // Load the full persisted adventure-temp meta if present
    try{ 
      const adv = loadAdventureTemp(); 
      if(adv && typeof adv === 'object'){
        // Merge all relevant fields from the saved adventure meta
        if(typeof adv.gold === 'number') ctx.meta.gold = adv.gold;
        if(Array.isArray(adv.ownedCards)) ctx.meta.ownedCards = adv.ownedCards;
        if(Array.isArray(adv.ownedSummons)) ctx.meta.ownedSummons = adv.ownedSummons;
        if(Array.isArray(adv.ownedLegendary)) ctx.meta.ownedLegendary = adv.ownedLegendary;
        if(typeof adv.potionCounts === 'object') ctx.meta.potionCounts = adv.potionCounts;
        if(typeof adv.apPerTurn === 'number') ctx.meta.apPerTurn = adv.apPerTurn;
        if(typeof adv.partySlots === 'number') ctx.meta.partySlots = adv.partySlots;
        // Only restore adventureProgress if we don't have current progress (initial load)
        if(!currentProgress && typeof adv.adventureProgress === 'object') ctx.meta.adventureProgress = adv.adventureProgress;
      }
    }catch(e){}
    // Restore the current progress if it existed
    if(currentProgress) ctx.meta.adventureProgress = currentProgress;
    
    // Validate and fix the adventure progress index if needed
    // This screen is 'adventure_daggerford_shop' which should be at index 10 in the flow
    try{
      if(ctx.meta.adventureProgress && ctx.meta.adventureProgress.adventureId === 'daggerford'){
        const currentIdx = ctx.meta.adventureProgress.index;
        // If we're not at index 10 (this shop), fix it
        // Index 10 is where adventure_daggerford_shop should be
        if(currentIdx !== 10){
          ctx.meta.adventureProgress.index = 10;
        }
      }
    }catch(e){}
    
    // Set defaults for any missing fields
    ctx.meta.gold = (typeof ctx.meta.gold === 'number') ? ctx.meta.gold : 0; 
    ctx.meta.potionCounts = ctx.meta.potionCounts || {}; 
    ctx.meta.ownedCards = ctx.meta.ownedCards || [];
    ctx.meta.ownedSummons = ctx.meta.ownedSummons || [];
    ctx.meta.ownedLegendary = ctx.meta.ownedLegendary || [];
  }catch(e){}

  function refreshUI(){ try{ goldDisplay.textContent = 'Gold: '+(ctx.meta.gold||0)+'g'; const canBuy = (ctx.meta.gold||0) >= 3; healBtn.disabled = !canBuy; speedBtn.disabled = !canBuy; healBtn.style.opacity = canBuy ? '1' : '0.5'; speedBtn.style.opacity = canBuy ? '1' : '0.5'; }catch(e){} }

  // Ensure UI reflects current temp save immediately
  try{ refreshUI(); }catch(e){}

  healBtn.addEventListener('click', ()=>{
    try{
      if((ctx.meta.gold||0) < 3) return;
      ctx.meta.gold -= 3;
      ctx.meta.ownedSummons = ctx.meta.ownedSummons || [];
      ctx.meta.potionCounts = ctx.meta.potionCounts || {};
      if(!ctx.meta.ownedSummons.includes('potion_of_healing')){
        ctx.meta.ownedSummons.push('potion_of_healing');
      }
      ctx.meta.potionCounts['potion_of_healing'] = (ctx.meta.potionCounts['potion_of_healing'] || 0) + 1;
      try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
      try{ if(typeof ctx.setMessage === 'function') ctx.setMessage('Bought Potion of Healing (x' + ctx.meta.potionCounts['potion_of_healing'] + ')'); }catch(e){}
      refreshUI();
    }catch(e){}
  });

  speedBtn.addEventListener('click', ()=>{
    try{
      if((ctx.meta.gold||0) < 3) return;
      ctx.meta.gold -= 3;
      ctx.meta.ownedSummons = ctx.meta.ownedSummons || [];
      ctx.meta.potionCounts = ctx.meta.potionCounts || {};
      if(!ctx.meta.ownedSummons.includes('potion_of_speed')){
        ctx.meta.ownedSummons.push('potion_of_speed');
      }
      ctx.meta.potionCounts['potion_of_speed'] = (ctx.meta.potionCounts['potion_of_speed'] || 0) + 1;
      try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
      try{ if(typeof ctx.setMessage === 'function') ctx.setMessage('Bought Potion of Speed (x' + ctx.meta.potionCounts['potion_of_speed'] + ')'); }catch(e){}
      refreshUI();
    }catch(e){}
  });

  // Add music controls
  addMusicControls(root);

  root.appendChild(container);
  setTimeout(startReveal, 2600);
}
