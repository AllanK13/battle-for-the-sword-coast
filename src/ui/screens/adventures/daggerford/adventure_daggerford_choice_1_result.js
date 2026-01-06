import { el } from '../../../renderer.js';
import { navigate } from '../../../router.js';
import { initMusic, disableStateHandlers, restoreStateHandlers } from '../../../../engine/helpers.js';
import { saveMetaIfAllowed, saveAdventureTemp } from '../../../../engine/meta.js';
import { splitNarrative } from '../text_split.js';
import { addMusicControls } from '../../../music-controls.js';
import { attachCinematicAdvance } from '../cinematic.js';
import { advanceAdventureStep } from '../../../../engine/adventure-flow.js';

export function renderAdventureDaggerfordChoice1Result(root, params){
  const ctx = (params && params.ctx) ? params.ctx : {};
  const choice = (params && params.choice) ? params.choice : 'keep';
  
  // Disable state handlers during cinematic
  const { prevOnState, prevSetMessage } = disableStateHandlers(ctx);
  if (ctx) ctx._cinematicActive = true;
  
  try{ initMusic('town.mp3'); }catch(e){}

  const container = el('div',{class:'adventure-cinematic', style:'position:relative;width:100%;height:100%;background:transparent;overflow:visible;color:#fff;display:flex;align-items:center;justify-content:center'},[]);

  const bg = el('img',{src:'assets/adventure/daggerford_street.jpg', alt:'Daggerford Streets', style:'position:absolute;left:50%;top:0;width:120vw;height:100vh;object-fit:auto;object-position:center top;transform-origin:top center;transform:translateX(-50%) scale(1.06);opacity:0;transition:opacity 4200ms ease, transform 4200ms ease'});
  bg.addEventListener('error', ()=>{ bg.src='assets/adventure/daggerford_street.jpg'; });
  bg.addEventListener('load', ()=>{ try{ const w = bg.naturalWidth || 1200; const h = bg.naturalHeight || 800; bg.style.width = w + 'px'; bg.style.height = h + 'px'; }catch(e){} });
  container.appendChild(bg);
  setTimeout(()=>{ try{ bg.style.opacity = '1'; bg.style.transform = 'translateX(-50%) scale(1.08)'; }catch(e){} }, 120);

  const overlay = el('div',{style:'position:absolute;left:0;top:0vh;width:100%;height:100%;z-index:6;pointer-events:none;opacity:0;transition:opacity 1200ms ease;background:linear-gradient(rgba(0, 0, 0, 0.85), rgba(0,0,0,0.85) 100%)'},[]);
  container.appendChild(overlay);
  setTimeout(()=>{ try{ overlay.style.opacity = '1'; }catch(e){} }, 2200);

  // If player returned the gold, show Curran (the priest) on-screen
  if(choice === 'return'){
    const curran = el('img',{src:'assets/curran.png', alt:'Curran', style:'position:absolute;left:36%;bottom:-220%;z-index:7;max-height:50vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
    curran.addEventListener('error', ()=>{ curran.style.display='none'; });
    curran.addEventListener('load', ()=>{ setTimeout(()=>{ try{ curran.style.opacity = '0.9'; }catch(e){} }, 2400); });
    container.appendChild(curran);
  }

  // Character portrait (Cree) - positioned at bottom left, outside text overlay but above background
  const portrait = el('img',{src:'assets/cree_teen.png', alt:'Cree', style:'position:absolute;left:8%;bottom:-195%;z-index:7;max-height:50vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  portrait.addEventListener('error', ()=>{ portrait.style.display='none'; });
  portrait.addEventListener('load', ()=>{ setTimeout(()=>{ try{ portrait.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(portrait);

  // Companion portraits (Shalendra, Volo) — positioned to the right of Cree, same vertical alignment and size
  const shalendra = el('img',{src:'assets/shalendra.png', alt:'Shalendra', style:'position:absolute;left:64%;bottom:-195%;z-index:7;max-height:50vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  shalendra.addEventListener('error', ()=>{ shalendra.style.display='none'; });
  shalendra.addEventListener('load', ()=>{ setTimeout(()=>{ try{ shalendra.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(shalendra);

  const volo = el('img',{src:'assets/volo.png', alt:'Volo', style:'position:absolute;left:90%;bottom:-195%;z-index:7;max-height:30vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  volo.addEventListener('error', ()=>{ volo.style.display='none'; });
  volo.addEventListener('load', ()=>{ setTimeout(()=>{ try{ volo.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(volo);

  // Adjust portrait vertical (bottom) positions based on the player's choice so layout reflects the decision
  try{
    if(choice === 'return'){
      // bring portraits up to be visible when Curran is present
      portrait.style.bottom = '-195%';
      shalendra.style.bottom = '-195%';
      volo.style.bottom = '-195%';
    } else {
      // default positions when player keeps the gold
      portrait.style.bottom = '-165%';
      shalendra.style.bottom = '-165%';
      volo.style.bottom = '-165%';
    }
  }catch(e){}

  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:1000px;width:90%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:0vh;'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  let text = '';
  let btnLabel = 'Continue';
  if(choice === 'return'){
    text = `
Curran’s eyes widen as the pouch is placed in his hands. He counts the coins once, then again, disbelief giving way to relief.|

"You didn't have to do this," he says, his voice unsteady. "But I won't forget it."|

Reaching into his pack, Curran produces a small glass vial filled with a faintly glowing red liquid.|

"Please—take this. It's not much, but it might save your life someday."`;
    btnLabel = 'Receive Potion of Healing';
  } else {
    text = `
Cree tightens his grip on the pouch and turns away. The weight of the coins is reassuring, even as the noise of the street closes in around him.|

Shalendra gives a short nod of approval. "You earned it." she says.|

Volo says nothing, his expression unreadable as he adjusts his hat and looks down the road where Curran might have been.|

The city moves on, indifferent as ever.`;
    btnLabel = 'Keep the gold';
  }

  const sentences = splitNarrative(text, '|');
  const pEls = sentences.map(s => { const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]); inner.appendChild(p); return p; });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

    // Attach left-click advancement helper
    attachCinematicAdvance(container, pEls, { onComplete: ()=>{ try{ if(typeof revealButtons === 'function') revealButtons(); }catch(e){} } });

  function startReveal(){ let totalDelay = 0; pEls.forEach((p, idx) => { const base = 700; const extra = Math.min(2000, (p.textContent.length || 0) * 12); const revealDelay = base + extra; totalDelay += revealDelay; setTimeout(()=>{ try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){} if(idx === pEls.length - 1){ setTimeout(revealButtons, 900); } }, totalDelay); totalDelay += 300; }); if(pEls.length === 0) revealButtons(); }

  function revealButtons(){ actionBtn.style.display = 'inline-block'; }

  const actionBtn = el('button',{class:'choice-action-btn', style:'display:none;z-index:10040;position:fixed;left:50%;transform:translateX(-50%);bottom:28px'},[ btnLabel ]);
  actionBtn.addEventListener('click', ()=>{
    try{
      if(choice === 'return' && ctx && ctx.isAdventure && ctx.meta){
        try{ ctx.meta.ownedSummons = ctx.meta.ownedSummons || []; }catch(e){}
        try{ ctx.meta.potionCounts = ctx.meta.potionCounts || {}; }catch(e){}
        if(!ctx.meta.ownedSummons.includes('potion_of_healing')){
          try{ ctx.meta.ownedSummons.push('potion_of_healing'); }catch(e){}
        }
        try{ ctx.meta.potionCounts['potion_of_healing'] = (ctx.meta.potionCounts['potion_of_healing'] || 0) + 1; }catch(e){}
        try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
        try{ if(typeof ctx.setMessage === 'function') ctx.setMessage('Received Potion of Healing (x' + ctx.meta.potionCounts['potion_of_healing'] + ')'); }catch(e){}
      } else if(choice !== 'return' && ctx && ctx.isAdventure && ctx.meta){
        try{ ctx.meta.gold = (typeof ctx.meta.gold === 'number') ? ctx.meta.gold : 0; }catch(e){}
        try{ ctx.meta.gold += 5; }catch(e){}
        try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
        // Ensure adventure-temp save updated explicitly
        try{ saveAdventureTemp(ctx.meta); }catch(e){}
        try{ if(typeof ctx.setMessage === 'function') ctx.setMessage('Gained 5 gold'); }catch(e){}
      }
    }catch(e){}
    
    // Restore handlers and clear cinematic flag before navigating
    try{ restoreStateHandlers(ctx, prevOnState, prevSetMessage); }catch(e){}
    if (ctx) ctx._cinematicActive = false;
    
    // Always navigate to the next cinematic scene instead of resuming the battle
    try{ 
      // Clear any stale cinematic callbacks before navigating to prevent auto-resumption
      if(ctx) delete ctx.onCinematicComplete;
      navigate('adventure_daggerford_scene_2', { ctx: ctx }); 
    }catch(e){ console.error('Failed to navigate to scene 2:', e); }
  });

  container.appendChild(actionBtn);

  // Add music controls
  addMusicControls(root);

  root.appendChild(container);
  setTimeout(startReveal, 2600);
}
