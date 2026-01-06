import { el } from '../../renderer.js';
import { navigate } from '../../router.js';
import { initMusic } from '../../../engine/helpers.js';
import { addMusicControls } from '../../music-controls.js';
import { advanceAdventureStep } from '../../../engine/adventure-flow.js';

// params: { ctx, shop }
export function renderAdventureShop(root, params = {}){
  const ctx = (params && params.ctx) ? params.ctx : (params || {});
  // Ensure ctx.data is populated if caller passed top-level `data` param
  try{ if((!ctx || !ctx.data) && params && params.data) ctx.data = params.data; }catch(e){}
  const shopFlag = (params && params.shop)
    ? params.shop
    : (ctx && ctx.shop)
    ? ctx.shop
    : (ctx && ctx.meta && ctx.meta.adventureProgress && ctx.meta.adventureProgress.adventureId)
    ? ctx.meta.adventureProgress.adventureId
    : null;
  
  // Validate and fix the adventure progress index if needed
  // This screen is 'adventure_shop' which should be at index 9 in the daggerford flow
  try{
    if(ctx && ctx.meta && ctx.meta.adventureProgress && ctx.meta.adventureProgress.adventureId === 'daggerford'){
      const currentIdx = ctx.meta.adventureProgress.index;
      // If we're not at index 9 (adventure_shop step), fix it
      if(currentIdx !== 9){
        ctx.meta.adventureProgress.index = 9;
      }
    }
  }catch(e){}
  
  try{ initMusic('town.mp3'); }catch(e){}
  const container = el('div',{class:'adventure-cinematic', style:'position:relative;width:100%;height:100%;background:transparent;overflow:visible;color:#fff;display:flex;align-items:center;justify-content:center'},[]);

  const bg = el('img',{src:'assets/adventure/shop.png', alt:'Shop', style:'position:absolute;left:50%;top:0;width:120vw;height:100vh;object-fit:auto;object-position:center top;transform-origin:top center;transform:translateX(-50%) scale(1.06);opacity:0;transition:opacity 4200ms ease, transform 4200ms ease'});
  bg.addEventListener('error', ()=>{ bg.src='assets/adventure/shop.png'; });
  bg.addEventListener('load', ()=>{ try{ const w = bg.naturalWidth || 1200; const h = bg.naturalHeight || 800; bg.style.width = w + 'px'; bg.style.height = h + 'px'; }catch(e){} });
  container.appendChild(bg);
  setTimeout(()=>{ try{ bg.style.opacity = '1'; bg.style.transform = 'translateX(-50%) scale(1.08)'; }catch(e){} }, 120);

  const overlay = el('div',{style:'position:absolute;left:0;top:0;width:100%;height:100%;z-index:6;pointer-events:none;background:linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))'},[]);
  container.appendChild(overlay);

  const btn = el('button',{class:'choice-action-btn', style:'position:fixed;left:50%;transform:translateX(-50%);bottom:28px;z-index:10040'},['Browse wares']);
  btn.addEventListener('click', ()=>{
    try{
      if(shopFlag === 'daggerford'){
        // Advance to the next shop step in the adventure flow
        try{ advanceAdventureStep(ctx); }catch(e){}
        navigate('adventure_daggerford_shop', { ctx, shop: 'daggerford', data: ctx && ctx.data });
      } else {
        navigate('arcade_upgrades', { data: ctx.data, meta: ctx.meta, buyLegendary: ctx.buyLegendary, setMessage: ctx.setMessage, isAdventure: ctx.isAdventure });
      }
    }catch(e){ try{ navigate('menu'); }catch(e){} }
  });
  container.appendChild(btn);

  // Add music controls
  addMusicControls(container);

  root.appendChild(container);
  return container;
}
