import { el } from '../../../renderer.js';
import { navigate } from '../../../router.js';
import { initMusic } from '../../../../engine/helpers.js';
import { AudioManager } from '../../../../engine/audio.js';
import { splitNarrative } from '../text_split.js';

export function renderAdventureDaggerfordChoice2(root, params){
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

  // Cree portrait (left)
  const cree = el('img',{src:'assets/cree_teen.png', alt:'Cree', style:'position:absolute;left:8%;bottom:-100%;z-index:7;max-height:50vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  cree.addEventListener('error', ()=>{ cree.style.display='none'; });
  cree.addEventListener('load', ()=>{ setTimeout(()=>{ try{ cree.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(cree);

  // Companion portraits (Shalendra, Volo) — same vertical alignment as Cree
  const shalendra = el('img',{src:'assets/shalendra.png', alt:'Shalendra', style:'position:absolute;left:64%;bottom:-100%;z-index:7;max-height:50vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  shalendra.addEventListener('error', ()=>{ shalendra.style.display='none'; });
  shalendra.addEventListener('load', ()=>{ setTimeout(()=>{ try{ shalendra.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(shalendra);

  const volo = el('img',{src:'assets/volo.png', alt:'Volo', style:'position:absolute;left:90%;bottom:-100%;z-index:7;max-height:30vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  volo.addEventListener('error', ()=>{ volo.style.display='none'; });
  volo.addEventListener('load', ()=>{ setTimeout(()=>{ try{ volo.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(volo);

  // Red Wizard portrait (to the right of Cree) — contained wrapper to avoid transform bbox inflation
  const redWizardWrap = el('div',{style:'position:absolute;left:35%;bottom:-120%;z-index:7;height:60vh;width:60vh;overflow:hidden;opacity:0;transition:opacity 2000ms ease;pointer-events:none;display:flex;align-items:center;justify-content:center'});
  const redWizard = el('img',{src:'assets/red_wizard.png', alt:'Red Wizard', style:'height:100%;width:auto;transform:rotate(270deg);transform-origin:center center;transition:transform 2000ms ease'});
  redWizard.addEventListener('error', ()=>{ redWizardWrap.style.display='none'; });
  redWizard.addEventListener('load', ()=>{ setTimeout(()=>{ try{ redWizardWrap.style.opacity = '0.9'; }catch(e){} }, 2400); });
  redWizardWrap.appendChild(redWizard);
  container.appendChild(redWizardWrap);

  // Keep Red Wizard wrapper sized to match Cree/Shalendra visual size (handles zoom)
  (function keepRedWizardMatched(){
    let resizeTimer = null;
    function sync(){
      try{
        const ref = shalendra || cree;
        if(!ref || !redWizardWrap) return;
        const r = ref.getBoundingClientRect();
        // match pixel dimensions so rotated image occupies same visual area
        // make the Red Wizard slightly larger than the reference (8%)
        const scale = 1.08;
        redWizardWrap.style.width = Math.round(r.width * scale) + 'px';
        redWizardWrap.style.height = Math.round(r.height * scale) + 'px';
      }catch(e){}
    }
    // debounce resize to avoid thrash
    function onResize(){ if(resizeTimer) clearTimeout(resizeTimer); resizeTimer = setTimeout(()=>{ sync(); resizeTimer = null; }, 120); }
    // initial sync after images load
    setTimeout(sync, 240);
    try{ window.addEventListener('resize', onResize); }catch(e){}
    // also sync when reference image loads (in case it loads later)
    try{ if(shalendra) shalendra.addEventListener('load', sync); if(cree) cree.addEventListener('load', sync); }catch(e){}
  })();

  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:1000px;width:90%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:0vh;'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  const text = `
The Red Wizard staggers backward, his spell focus clattering to the floor. The necromantic energy that once surrounded him fades, leaving only exhaustion and fear.|
He looks up at Cree, bloodied but alive.|
“It’s over,” he mutters. “Szass Tam is gone. I see that now.”|
A heavy pouch of gold hangs at his belt—undoubtedly taken from raids, bribes, and darker acts. The tavern’s warmth feels distant here, replaced by the weight of consequence.|
Shalendra watches silently, hand on her blade. Volo adjusts his hat, saying nothing—for once.|
The wizard lowers his head and waits.
`;
  const sentences = splitNarrative(text, '|');
  const pEls = sentences.map(s => { const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]); inner.appendChild(p); return p; });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

  function startReveal(){ let totalDelay = 0; pEls.forEach((p, idx) => { const base = 700; const extra = Math.min(2000, (p.textContent.length || 0) * 12); const revealDelay = base + extra; totalDelay += revealDelay; setTimeout(()=>{ try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){} if(idx === pEls.length - 1){ setTimeout(revealButtons, 900); } }, totalDelay); totalDelay += 300; }); if(pEls.length === 0) revealButtons(); }

  function revealButtons(){ btnRow.style.display = 'flex'; }

  const btnRow = el('div',{class:'choice-btn-row', style:'display:none;z-index:10040;gap:12px;'},[]);
  const bLive = el('button',{class:'choice-action-btn'},['Let him live']);
  const bKill = el('button',{class:'choice-action-btn'},['Kill him']);
  bLive.addEventListener('click', ()=>{ try{ ctx.choice = 'live'; navigate('battle', ctx); }catch(e){ try{ navigate('battle'); }catch(e){} } });
  bKill.addEventListener('click', ()=>{ try{ ctx.choice = 'kill'; navigate('battle', ctx); }catch(e){ try{ navigate('battle'); }catch(e){} } });
  btnRow.appendChild(bLive);
  btnRow.appendChild(bKill);
  container.appendChild(btnRow);

  // Kick off reveal
  setTimeout(startReveal, 2600);

  // Floating music control (matches other screens)
  try{
    const musicBtn = el('button',{class:'btn music-btn floating icon', style:'position:fixed;right:18px;bottom:36px;z-index:10030;height:40px;display:flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:6px;background:linear-gradient(180deg,#10b981,#047857);color:#fff;border:1px solid rgba(0,0,0,0.12);font-size:22px', title:'Music'},[ AudioManager.isEnabled() ? '🔊' : '🔈' ]);
    musicBtn.addEventListener('click', ()=>{ const on = AudioManager.toggle(); musicBtn.textContent = on ? '🔊' : '🔈'; });
    container.appendChild(musicBtn);
  }catch(e){}

  root.appendChild(container);
  return container;
}
