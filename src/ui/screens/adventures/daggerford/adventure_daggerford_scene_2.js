import { el } from '../../../renderer.js';
import { AudioManager } from '../../../../engine/audio.js';
import { navigate } from '../../../router.js';
import { initMusic, disableStateHandlers, restoreStateHandlers } from '../../../../engine/helpers.js';
import { saveMetaIfAllowed } from '../../../../engine/meta.js';
import { getNextStep, advanceAdventureStep } from '../../../../engine/adventure-flow.js';
import { splitNarrative } from '../text_split.js';
import { addMusicControls } from '../../../music-controls.js';
import { attachCinematicAdvance } from '../cinematic.js';

export function renderAdventureDaggerfordScene2(root, params = {}){
  const ctx = (params && params.ctx) ? params.ctx : params;
  
  // Disable state handlers to prevent background session updates from
  // forcing navigation while the cinematic is visible
  const { prevOnState, prevSetMessage } = disableStateHandlers(ctx);
  
  // Set cinematic flag to provide additional guard
  if (ctx) ctx._cinematicActive = true;
  
  const container = el('div',{class:'adventure-cinematic', style:'position:relative;width:100%;height:100%;background:transparent;overflow:visible;color:#fff;display:flex;align-items:center;justify-content:center'},[]);

  const bg = el('img',{src:'assets/adventure/daggerford_tavern.jpg', alt:'Daggerford Tavern', style:'position:absolute;left:50%;top:0;width:120vw;height:100vh;object-fit:auto;object-position:center top;transform-origin:top center;transform:translateX(-50%) scale(1.2);opacity:0;transition:opacity 4200ms ease, transform 4200ms ease'});
  bg.addEventListener('error', ()=>{ bg.src='assets/adventure/daggerford_tavern.jpg'; });
  bg.addEventListener('load', ()=>{ try{ const w = bg.naturalWidth || 1200; const h = bg.naturalHeight || 800; const scale = 1.5; bg.style.width = Math.round(w * scale) + 'px'; bg.style.height = Math.round(h * scale) + 'px'; }catch(e){} });
  container.appendChild(bg);
  setTimeout(()=>{ try{ bg.style.opacity = '1'; bg.style.transform = 'translateX(-50%) scale(1.3)'; }catch(e){} }, 120);

  const overlay = el('div',{style:'position:absolute;left:0;top:0vh;width:100%;height:100%;z-index:6;pointer-events:none;opacity:0;transition:opacity 1200ms ease;background:linear-gradient(rgba(0, 0, 0, 0.85), rgba(0,0,0,0.85) 100%)'},[]);
  container.appendChild(overlay);
  setTimeout(()=>{ try{ overlay.style.opacity = '1'; }catch(e){} }, 2200);

  // Character portraits: Cree (left) and Syranna (to the right) — match scene 1 placement/size
  const portrait = el('img',{src:'assets/cree_teen.png', alt:'Cree', style:'position:absolute;left:8%;bottom:-45%;z-index:7;max-height:32vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  portrait.addEventListener('error', ()=>{ portrait.style.display='none'; });
  portrait.addEventListener('load', ()=>{ setTimeout(()=>{ try{ portrait.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(portrait);

  const syrannaPortrait = el('img',{src:'assets/syranna.png', alt:'Syranna', style:'position:absolute;left:65%;bottom:-45%;z-index:7;max-height:32vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  syrannaPortrait.addEventListener('error', ()=>{ syrannaPortrait.style.display='none'; });
  syrannaPortrait.addEventListener('load', ()=>{ setTimeout(()=>{ try{ syrannaPortrait.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(syrannaPortrait);

  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:1000px;width:90%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:0vh;'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  const text = `
The tavern is loud, crowded, and thick with the smell of ale as Cree and the party step inside. Shalendra’s hand hovers near her blade. Volo, already smiling, surveys the room like a scholar hunting a story.|
At a central table sits a woman in crimson robes. She rises as Cree approaches, her gaze sharp and measured.|
“My name is Syranna,” she says. “I was a Red Wizard of Thay.” The words carry weight. The tavern falls quiet.|
“As you know, Szass Tam was defeated.” Syranna continues. “But one of his servants refuses to accept it. A rogue Red Wizard still acts in his name, spreading corruption and gathering power.” She conjures a brief illusion of a robed figure wreathed in necromantic energy, then lets it fade.|
“I want him found and confronted before he causes greater harm. I know you are capable, Volo here has vouched for your ability.”|
Shalendra’s eyes narrow. “And what do we get in return?”|
Syranna looks toward Shalendra, “I will inform the Heroes of Faerun personally of your heroics.” She then gestures toward two figures waiting nearby. “You will not go alone.”|
One looks young and curious, but clearly powerful, with rock-like skin and electricity sparking in his hands. The other stands calmly, angelic wings tucked behind her bare shoulder, golden eyes piercing through the room. |
“Choose who you want to accompany you, the other stays behind.” Her gaze settles on Cree.
`;
  const sentences = splitNarrative(text, '|');
  const pEls = sentences.map(s => { const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]); inner.appendChild(p); return p; });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

  // Attach left-click advancement helper
  attachCinematicAdvance(container, pEls, { onComplete: ()=>{ try{ if(typeof revealContinue === 'function') revealContinue(); }catch(e){} try{ if(typeof revealButtons === 'function') revealButtons(); }catch(e){} } });

  function startReveal(){ let totalDelay = 0; pEls.forEach((p, idx) => { const base = 700; const extra = Math.min(2000, (p.textContent.length || 0) * 12); const revealDelay = base + extra; totalDelay += revealDelay; setTimeout(()=>{ try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){} if(idx === pEls.length - 1){ setTimeout(revealContinue, 900); } }, totalDelay); totalDelay += 300; }); if(pEls.length === 0) revealContinue(); }

  // Button row like choice_1: show two recruit buttons after reveal
  function revealContinue(){ btnRow.style.display = 'flex'; }
  setTimeout(startReveal, 2600);

  const btnRow = el('div',{class:'choice-btn-row', style:'display:none;z-index:10040;gap:12px;'},[]);
  const recruitGrogu = el('button',{class:'choice-action-btn'},['Recruit Grogu']);
  const recruitLumalia = el('button',{class:'choice-action-btn'},['Recruit Lumalia']);
  recruitGrogu.addEventListener('click', async ()=>{
    try{
      // Save recruit choice to meta
      ctx.recruit = 'grogu';
      try{ 
        ctx.meta = ctx.meta || {}; 
        ctx.meta.lastRecruit = ctx.recruit;
        // Also add to owned cards for the adventure session
        ctx.meta.ownedCards = ctx.meta.ownedCards || [];
        // Ensure only the chosen recruit is present (remove the alternative)
        try{ ctx.meta.ownedCards = ctx.meta.ownedCards.filter(id => id !== 'lumalia'); }catch(e){}
        if (!ctx.meta.ownedCards.includes('grogu')) ctx.meta.ownedCards.push('grogu');
        saveMetaIfAllowed(ctx.meta, ctx); 
      }catch(e){}
      
      // Persist adventure meta (gold/consumables and deck state should be stored here)
      try{ ctx.meta = ctx.meta || {}; ctx.meta.gold = (typeof ctx.meta.gold === 'number') ? ctx.meta.gold : 0; ctx.meta.potionCounts = ctx.meta.potionCounts || {}; saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}

      // Start a normal encounter using the existing deck-builder + startEncounter flow.
      try{
        if(!ctx.data || !ctx.data.enemies) throw new Error('Missing adventure data');
        const { buildDeck } = await import('../../../../engine/deck.js');
        const { startEncounter } = await import('../../../../engine/encounter.js');
        // prefer reusing existing encounter RNG if present
        const rng = (ctx && ctx.encounter && ctx.encounter.rng) ? ctx.encounter.rng : (await import('../../../../engine/rng.js')).createRNG();
        const redWizard = ctx.data.enemies.find(e => e && e.id === 'red_wizard');
        if(!redWizard) throw new Error('Red wizard not found');
        const legendaryCards = (ctx.data.legendary || []).filter(l => l && typeof l.hp === 'number');
        const cardDefs = (ctx.data.cards || []).concat(legendaryCards);
        const chosen = (ctx && Array.isArray(ctx._initialChosen) && ctx._initialChosen.length>0) ? ctx._initialChosen : ((ctx.meta && Array.isArray(ctx.meta.ownedCards)) ? ctx.meta.ownedCards : []);
        const deck = buildDeck(cardDefs, chosen, rng);
        // Mutate the existing encounter object (closure in createEncounterSession depends on the original reference).
        try{
          const enc = ctx.encounter || {};
          enc.enemy = { ...redWizard };
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
          // Keep the same ctx.encounter object reference so outer closures operate on it
          ctx.encounter = enc;
        }catch(e){ console.error('Failed to mutate existing encounter object', e); }
      }catch(e){ console.error('Failed to start encounter via normal flow', e); }

      // Restore state handlers and clear cinematic flag
      restoreStateHandlers(ctx, prevOnState, prevSetMessage);
      if (ctx) ctx._cinematicActive = false;

      // Clear any leftover enemySequence so the encounter won't swap to thugs
      try{ if(ctx && Array.isArray(ctx.enemySequence)) ctx.enemySequence = []; }catch(e){}

      // Ensure adventure flow advances so the next step is the Red Wizard battle.
      try{
        const next = getNextStep(ctx);
        if(next && next.type === 'battle'){
          try{ advanceAdventureStep(ctx); }catch(e){}
        }
      }catch(e){ console.error('Failed to advance adventure step before battle', e); }

      navigate('battle', ctx);
    }catch(e){ console.error('Recruit Grogu failed:', e); try{ navigate('battle', ctx); }catch(e){} }
  });
  recruitLumalia.addEventListener('click', async ()=>{
    try{
      // Save recruit choice to meta
      ctx.recruit = 'lumalia';
      try{ 
        ctx.meta = ctx.meta || {}; 
        ctx.meta.lastRecruit = ctx.recruit;
        // Also add to owned cards for the adventure session
        ctx.meta.ownedCards = ctx.meta.ownedCards || [];
        // Ensure only the chosen recruit is present (remove the alternative)
        try{ ctx.meta.ownedCards = ctx.meta.ownedCards.filter(id => id !== 'grogu'); }catch(e){}
        if (!ctx.meta.ownedCards.includes('lumalia')) ctx.meta.ownedCards.push('lumalia');
        saveMetaIfAllowed(ctx.meta, ctx); 
      }catch(e){}
      
      // Persist adventure meta (gold/consumables and deck state should be stored here)
      try{ ctx.meta = ctx.meta || {}; ctx.meta.gold = (typeof ctx.meta.gold === 'number') ? ctx.meta.gold : 0; ctx.meta.potionCounts = ctx.meta.potionCounts || {}; saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}

      // Start a normal encounter using the existing deck-builder and MUTATE the current encounter object.
      try{
        if(!ctx.data || !ctx.data.enemies) throw new Error('Missing adventure data');
        const { buildDeck } = await import('../../../../engine/deck.js');
        const rng = (ctx && ctx.encounter && ctx.encounter.rng) ? ctx.encounter.rng : (await import('../../../../engine/rng.js')).createRNG();
        const redWizard = ctx.data.enemies.find(e => e && e.id === 'red_wizard');
        if(!redWizard) throw new Error('Red wizard not found');
        const legendaryCards = (ctx.data.legendary || []).filter(l => l && typeof l.hp === 'number');
        const cardDefs = (ctx.data.cards || []).concat(legendaryCards);
        const chosen = (ctx && Array.isArray(ctx._initialChosen) && ctx._initialChosen.length>0) ? ctx._initialChosen : ((ctx.meta && Array.isArray(ctx.meta.ownedCards)) ? ctx.meta.ownedCards : []);
        const deck = buildDeck(cardDefs, chosen, rng);
        try{
          const enc = ctx.encounter || {};
          enc.enemy = { ...redWizard };
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
        }catch(e){ console.error('Failed to mutate existing encounter object', e); }
      }catch(e){ console.error('Failed to start encounter via normal flow', e); }

      // Restore state handlers and clear cinematic flag
      restoreStateHandlers(ctx, prevOnState, prevSetMessage);
      if (ctx) ctx._cinematicActive = false;

      // Clear any leftover enemySequence so the encounter won't swap to thugs
      try{ if(ctx && Array.isArray(ctx.enemySequence)) ctx.enemySequence = []; }catch(e){}

      // Ensure adventure flow advances so the next step is the Red Wizard battle.
      try{
        const next = getNextStep(ctx);
        if(next && next.type === 'battle'){
          try{ advanceAdventureStep(ctx); }catch(e){}
        }
      }catch(e){ console.error('Failed to advance adventure step before battle', e); }

      navigate('battle', ctx);
    }catch(e){ console.error('Recruit Lumalia failed:', e); try{ navigate('battle', ctx); }catch(e){} }
  });
  btnRow.appendChild(recruitGrogu);
  btnRow.appendChild(recruitLumalia);
  container.appendChild(btnRow);

  try{ initMusic('town.mp3'); try{ AudioManager.play(); }catch(e){} }catch(e){}

  // Add music controls
  addMusicControls(container);

  root.appendChild(container);
  return container;
}
