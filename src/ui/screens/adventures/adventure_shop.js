import { el } from '../../renderer.js';
import { navigate } from '../../router.js';
import { initMusic } from '../../../engine/helpers.js';
import { addMusicControls } from '../../music-controls.js';

// params: { ctx, shop }
export function renderAdventureShop(root, params = {}){
  const ctx = (params && params.ctx) ? params.ctx : (params || {});
  const shopFlag = (params && params.shop) ? params.shop : (ctx && ctx.shop) ? ctx.shop : null;
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
        navigate('daggerford_shop', { ctx, shop: 'daggerford' });
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
