import { el } from '../../../renderer.js';
import { navigate } from '../../../router.js';
import { initMusic } from '../../../../engine/helpers.js';
import { saveMetaIfAllowed } from '../../../../engine/meta.js';
import { splitNarrative } from '../text_split.js';
import { addMusicControls } from '../../../music-controls.js';

export function renderDaggerfordShop(root, params = {}){
  const ctx = (params && params.ctx) ? params.ctx : {};
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

  function startReveal(){ let totalDelay = 0; pEls.forEach((p, idx) => { const base = 700; const extra = Math.min(2000, (p.textContent.length || 0) * 12); const revealDelay = base + extra; totalDelay += revealDelay; setTimeout(()=>{ try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){} if(idx === pEls.length - 1){ setTimeout(revealButtons, 900); } }, totalDelay); totalDelay += 300; }); if(pEls.length === 0) revealButtons(); }

  function revealButtons(){ purchaseWrap.style.display = 'flex'; continueBtn.style.display = 'inline-block'; }

  // Purchase UI
  const purchaseWrap = el('div',{style:'position:relative;z-index:10040;display:none;gap:12px;align-items:center;justify-content:center;flex-direction:column;'},[]);
  // Row: Potion of Healing | gold display | Potion of Speed
  const row = el('div',{style:'display:flex;align-items:center;gap:12px'},[]);
  const healBtn = el('button',{class:'choice-action-btn', style:'padding:10px 14px;font-size:16px'},['Potion of Healing (3g)']);
  const goldDisplay = el('div',{style:'min-width:160px;text-align:center;color:#ffd54f;font-weight:700;font-size:18px'},['Gold: 0g']);
  const speedBtn = el('button',{class:'choice-action-btn', style:'padding:10px 14px;font-size:16px'},['Potion of Speed (3g)']);
  row.appendChild(healBtn); row.appendChild(goldDisplay); row.appendChild(speedBtn);
  purchaseWrap.appendChild(row);

  const continueBtn = el('button',{class:'choice-action-btn', style:'display:none;z-index:10040;position:fixed;left:50%;transform:translateX(-50%);bottom:18px'},['Fight Szass Tam']);
  continueBtn.addEventListener('click', async ()=>{ 
    try{ 
      AudioManager.playSfx(['./assets/music/boom.mp3','assets/music/boom.mp3'], { volume: 0.6 }); 
    }catch(e){}
    try{ 
      // Validate we have the necessary data
      if(!ctx || !ctx.data || !ctx.data.enemies){
        console.error('Missing ctx.data.enemies - cannot start battle');
        alert('Debug mode: Please check "Pass ctx" checkbox before navigating to daggerford_shop');
        navigate('adventure_start');
        return;
      }
      // Start battle against Szass Tam
      const szassTam = ctx.data.enemies.find(e => e && e.id === 'szass_tam');
      if(szassTam){
        // Create encounter session for Szass Tam
        const { createRNG } = await import('../../../../engine/rng.js');
        const { buildDeck } = await import('../../../../engine/deck.js');
        const { startEncounter } = await import('../../../../engine/encounter.js');
        const rng = createRNG();
        const legendaryCards = (ctx.data.legendary || []).filter(l => l && typeof l.hp === 'number');
        const cardDefs = (ctx.data.cards || []).concat(legendaryCards);
        const chosen = (ctx.meta && Array.isArray(ctx.meta.ownedCards)) ? ctx.meta.ownedCards : [];
        const deck = buildDeck(cardDefs, chosen, rng);
        const encounter = startEncounter({...szassTam}, deck, rng, { apPerTurn: (ctx.meta && ctx.meta.apPerTurn) || 3 });
        ctx.encounter = encounter;
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
  try{ ctx.meta = ctx.meta || {}; ctx.meta.gold = (typeof ctx.meta.gold === 'number') ? ctx.meta.gold : 0; ctx.meta.potionCounts = ctx.meta.potionCounts || {}; }catch(e){}

  function refreshUI(){ try{ goldDisplay.textContent = 'Gold: '+(ctx.meta.gold||0)+'g'; const canBuy = (ctx.meta.gold||0) >= 3; healBtn.disabled = !canBuy; speedBtn.disabled = !canBuy; healBtn.style.opacity = canBuy ? '1' : '0.5'; speedBtn.style.opacity = canBuy ? '1' : '0.5'; }catch(e){} }

  healBtn.addEventListener('click', ()=>{
    try{
      if((ctx.meta.gold||0) < 3) return;
      ctx.meta.gold -= 3;
      ctx.meta.potionCounts = ctx.meta.potionCounts || {};
      ctx.meta.potionCounts['potion_of_healing'] = (ctx.meta.potionCounts['potion_of_healing'] || 0) + 1;
      try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
      try{ if(typeof ctx.setMessage === 'function') ctx.setMessage('Bought Potion of Healing'); }catch(e){}
      refreshUI();
    }catch(e){}
  });

  speedBtn.addEventListener('click', ()=>{
    try{
      if((ctx.meta.gold||0) < 3) return;
      ctx.meta.gold -= 3;
      ctx.meta.potionCounts = ctx.meta.potionCounts || {};
      ctx.meta.potionCounts['potion_of_speed'] = (ctx.meta.potionCounts['potion_of_speed'] || 0) + 1;
      try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
      try{ if(typeof ctx.setMessage === 'function') ctx.setMessage('Bought Potion of Speed'); }catch(e){}
      refreshUI();
    }catch(e){}
  });

  // Add music controls
  addMusicControls(root);

  root.appendChild(container);
  setTimeout(startReveal, 2600);
}
