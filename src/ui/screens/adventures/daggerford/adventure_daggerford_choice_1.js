import { el } from '../../../renderer.js';
import { navigate } from '../../../router.js';
import { initMusic } from '../../../../engine/helpers.js';
import { AudioManager } from '../../../../engine/audio.js';
import { splitNarrative } from '../text_split.js';

export function renderAdventureDaggerfordChoice1(root, params){
  const ctx = (params && params.ctx) ? params.ctx : {};
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

  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:1000px;width:90%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:0vh;'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  const text = `
With the help of two passersby—Shalendra and Volo—Cree manages to drive off the thugs. A search of their bodies reveals a small pouch containing five gold pieces.|

Volo exhales slowly. “I recognize this pouch,” he says. “It was stolen from a local priest named Curran. He doesn’t live far from here, and we should return his gold.”|

Shalendra folds her arms. “Or it’s payment earned. Cree stepped in when no one else would. Five gold is hardly excessive for the risk.”|

Both turn to Cree, awaiting his decision.`;
  const sentences = splitNarrative(text, '|');
  const pEls = sentences.map(s => { const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]); inner.appendChild(p); return p; });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

  function startReveal(){ let totalDelay = 0; pEls.forEach((p, idx) => { const base = 700; const extra = Math.min(2000, (p.textContent.length || 0) * 12); const revealDelay = base + extra; totalDelay += revealDelay; setTimeout(()=>{ try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){} if(idx === pEls.length - 1){ setTimeout(revealButtons, 900); } }, totalDelay); totalDelay += 300; }); if(pEls.length === 0) revealButtons(); }

  function revealButtons(){ btnRow.style.display = 'flex'; }

  const btnRow = el('div',{class:'choice-btn-row', style:'display:none;z-index:10040;gap:12px;'},[]);
  const b1 = el('button',{class:'choice-action-btn'},['Return the gold to Curran']);
  const b2 = el('button',{class:'choice-action-btn'},['Keep the gold as your reward']);
  b1.addEventListener('click', ()=>{ navigate('adventure_daggerford_choice_1_result', { ctx, choice: 'return', resumeCallback: params && params.resumeCallback }); });
  b2.addEventListener('click', ()=>{ navigate('adventure_daggerford_choice_1_result', { ctx, choice: 'keep', resumeCallback: params && params.resumeCallback }); });
  btnRow.appendChild(b1); btnRow.appendChild(b2);
  container.appendChild(btnRow);

  try{
    const musicBtn = el('button',{class:'btn music-btn floating icon', style:'position:fixed;right:18px;bottom:36px;z-index:10030;height:40px;display:flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:6px;background:linear-gradient(180deg,#10b981,#047857);color:#fff;border:1px solid rgba(0,0,0,0.12);font-size:22px', title:'Music'},[ AudioManager.isEnabled() ? '🔊' : '🔈' ]);
    musicBtn.addEventListener('click', ()=>{ const on = AudioManager.toggle(); musicBtn.textContent = on ? '🔊' : '🔈'; });
    container.appendChild(musicBtn);
  }catch(e){}

  root.appendChild(container);
  setTimeout(startReveal, 2600);
}
