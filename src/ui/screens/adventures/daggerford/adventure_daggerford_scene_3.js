import { el } from '../../../renderer.js';
import { AudioManager } from '../../../../engine/audio.js';
import { navigate } from '../../../router.js';
import { initMusic, disableStateHandlers, restoreStateHandlers } from '../../../../engine/helpers.js';
import { saveMetaIfAllowed } from '../../../../engine/meta.js';
import { splitNarrative } from '../text_split.js';
import { addMusicControls } from '../../../music-controls.js';
import { attachCinematicAdvance } from '../cinematic.js';
import { advanceAdventureStep } from '../../../../engine/adventure-flow.js';

export function renderAdventureDaggerfordScene3(root, ctx = {}){
  // Disable state handlers during cinematic
  const { prevOnState, prevSetMessage } = disableStateHandlers(ctx);
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
  const portrait = el('img',{src:'assets/cree_teen.png', alt:'Cree', style:'position:absolute;left:8%;bottom:-75%;z-index:7;max-height:32vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  portrait.addEventListener('error', ()=>{ portrait.style.display='none'; });
  portrait.addEventListener('load', ()=>{ setTimeout(()=>{ try{ portrait.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(portrait);

  const syrannaPortrait = el('img',{src:'assets/syranna.png', alt:'Syranna', style:'position:absolute;left:65%;bottom:-75%;z-index:7;max-height:32vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  syrannaPortrait.addEventListener('error', ()=>{ syrannaPortrait.style.display='none'; });
  syrannaPortrait.addEventListener('load', ()=>{ setTimeout(()=>{ try{ syrannaPortrait.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(syrannaPortrait);

  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:1000px;width:90%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:0vh;'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  const text = `
Syranna is waiting when you return, her expression already grim.|
“This is worse than I feared,” she says. “Szass Tam has returned — truly returned.”|
The name silences the table.|
“The Heroes of Faerûn are mobilizing, but they are stretched thin. They won't be able to reach him before he's returned to full strength.”|
Shalendra straightens. “So that leaves us.”|
“Yes,” Syranna replies. “We can attack him while he's weakened, but we must act quickly.”|
Volo sighs. “I was hoping for a quieter next chapter.”|
Syranna meets Cree’s gaze. “Before you go — prepare. Stock up. You’ll need everything you can carry.”|
She gestures toward the door.|
“The general store is still open. After that, you hunt Szass Tam.”
`;
  const sentences = splitNarrative(text, '|');
  const pEls = sentences.map(s => { const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]); inner.appendChild(p); return p; });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

  // Attach left-click advancement helper
  attachCinematicAdvance(container, pEls, { onComplete: ()=>{ try{ if(typeof revealButtons === 'function') revealButtons(); }catch(e){} } });

  function startReveal(){ let totalDelay = 0; pEls.forEach((p, idx) => { const base = 700; const extra = Math.min(2000, (p.textContent.length || 0) * 12); const revealDelay = base + extra; totalDelay += revealDelay; setTimeout(()=>{ try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){} if(idx === pEls.length - 1){ setTimeout(revealButtons, 900); } }, totalDelay); totalDelay += 300; }); if(pEls.length === 0) revealButtons(); }

  function revealButtons(){ actionBtn.style.display = 'inline-block'; }
  setTimeout(startReveal, 2600);

  const actionBtn = el('button',{class:'choice-action-btn', style:'display:none;z-index:10040;position:fixed;left:50%;transform:translateX(-50%);bottom:28px'},['Go shopping']);
  actionBtn.addEventListener('click', ()=>{
    // Restore handlers and clear cinematic flag before navigating
    try{ restoreStateHandlers(ctx, prevOnState, prevSetMessage); }catch(e){}
    if (ctx) ctx._cinematicActive = false;
    
      try{
        // Ensure adventure progress exists and advance to the shop step so navigation is allowed
        try{
          ctx.meta = ctx.meta || {};
          // If adventureProgress not set, initialize to current scene index (scene_3)
          if(!ctx.meta.adventureProgress) ctx.meta.adventureProgress = { adventureId: 'daggerford', index: 8 };
          const current = getCurrentStep(ctx);
          if(current && current.id === 'adventure_daggerford_scene_3'){
            try{ advanceAdventureStep(ctx); }catch(e){}
          }
        }catch(e){}
        navigate('adventure_shop', { ctx, shop: 'daggerford', data: ctx.data });
      }catch(e){ try{ navigate('menu'); }catch(e){} }
  });
  container.appendChild(actionBtn);

  try{ initMusic('town.mp3'); try{ AudioManager.play(); }catch(e){} }catch(e){}

  // Add music controls
  addMusicControls(container);

  root.appendChild(container);
  return container;
}
