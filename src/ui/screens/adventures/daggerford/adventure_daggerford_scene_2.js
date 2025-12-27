import { el } from '../../../renderer.js';
import { AudioManager } from '../../../../engine/audio.js';
import { navigate } from '../../../router.js';
import { initMusic } from '../../../../engine/helpers.js';
import { splitNarrative } from '../text_split.js';

export function renderAdventureDaggerfordScene2(root, ctx = {}){
  const container = el('div',{class:'adventure-cinematic', style:'position:relative;width:100%;height:100%;background:transparent;overflow:visible;color:#fff;display:flex;align-items:center;justify-content:center'},[]);

  const bg = el('img',{src:'assets/adventure/daggerford_tavern.jpg', alt:'Daggerford Tavern', style:'position:absolute;left:50%;top:0;width:120vw;height:100vh;object-fit:auto;object-position:center top;transform-origin:top center;transform:translateX(-50%) scale(1.06);opacity:0;transition:opacity 4200ms ease, transform 4200ms ease'});
  bg.addEventListener('error', ()=>{ bg.src='assets/adventure/daggerford_tavern.jpg'; });
  bg.addEventListener('load', ()=>{ try{ const w = bg.naturalWidth || 1200; const h = bg.naturalHeight || 800; bg.style.width = w + 'px'; bg.style.height = h + 'px'; }catch(e){} });
  container.appendChild(bg);
  setTimeout(()=>{ try{ bg.style.opacity = '1'; bg.style.transform = 'translateX(-50%) scale(1.08)'; }catch(e){} }, 120);

  const overlay = el('div',{style:'position:absolute;left:0;top:0vh;width:100%;height:100%;z-index:6;pointer-events:none;opacity:0;transition:opacity 1200ms ease;background:linear-gradient(rgba(0, 0, 0, 0.85), rgba(0,0,0,0.85) 100%)'},[]);
  container.appendChild(overlay);
  setTimeout(()=>{ try{ overlay.style.opacity = '1'; }catch(e){} }, 2200);

  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:1000px;width:90%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:0vh;'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  const text = `
You step into the tavern, the air thick with smoke and the murmur of conversation.

Placeholder: Scene 2 content goes here.
`;
  const sentences = splitNarrative(text, '|');
  const pEls = sentences.map(s => { const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]); inner.appendChild(p); return p; });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

  function startReveal(){ let totalDelay = 0; pEls.forEach((p, idx) => { const base = 700; const extra = Math.min(2000, (p.textContent.length || 0) * 12); const revealDelay = base + extra; totalDelay += revealDelay; setTimeout(()=>{ try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){} if(idx === pEls.length - 1){ setTimeout(revealContinue, 900); } }, totalDelay); totalDelay += 300; }); if(pEls.length === 0) revealContinue(); }

  function revealContinue(){ continueBtn.style.display = 'inline-block'; }
  setTimeout(startReveal, 2600);

  const continueBtn = el('button',{class:'start-run-btn', style:'display:none;z-index:10040'},['Continue']);
  continueBtn.addEventListener('click', ()=>{
    try{ if(ctx && typeof ctx.onCinematicComplete === 'function') ctx.onCinematicComplete(); else navigate('battle'); }catch(e){ navigate('battle'); }
  });
  container.appendChild(continueBtn);

  try{ initMusic('town.mp3'); try{ AudioManager.play(); }catch(e){} }catch(e){}

  root.appendChild(container);
  return container;
}
