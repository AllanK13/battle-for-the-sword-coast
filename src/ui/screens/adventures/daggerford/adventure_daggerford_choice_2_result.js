import { el } from '../../../renderer.js';
import { navigate } from '../../../router.js';
import { initMusic } from '../../../../engine/helpers.js';
import { saveMetaIfAllowed } from '../../../../engine/meta.js';
import { splitNarrative } from '../text_split.js';
import { addMusicControls } from '../../../music-controls.js';

export function renderAdventureDaggerfordChoice2Result(root, params){
  const ctx = (params && params.ctx) ? params.ctx : {};
  const choice = (params && params.choice) ? params.choice : 'kill';
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

  // Portraits: Cree (left), Shalendra and Volo (right)
  const portrait = el('img',{src:'assets/cree_teen.png', alt:'Cree', style:'position:absolute;left:8%;bottom:-82%;z-index:7;max-height:50vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  portrait.addEventListener('error', ()=>{ portrait.style.display='none'; });
  portrait.addEventListener('load', ()=>{ setTimeout(()=>{ try{ portrait.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(portrait);

  const shalendra = el('img',{src:'assets/shalendra.png', alt:'Shalendra', style:'position:absolute;left:64%;bottom:-82%;z-index:7;max-height:50vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  shalendra.addEventListener('error', ()=>{ shalendra.style.display='none'; });
  shalendra.addEventListener('load', ()=>{ setTimeout(()=>{ try{ shalendra.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(shalendra);

  const volo = el('img',{src:'assets/volo.png', alt:'Volo', style:'position:absolute;left:90%;bottom:-82%;z-index:7;max-height:30vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  volo.addEventListener('error', ()=>{ volo.style.display='none'; });
  volo.addEventListener('load', ()=>{ setTimeout(()=>{ try{ volo.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(volo);

  // If player let him live, display Tor where Red Wizard was
  if(choice === 'live'){
    // Use pixel sizing computed once from the reference portrait so Tor does not resize with the window
    const torWrap = el('div',{style:'position:absolute;left:35%;bottom:-98%;z-index:7;height:auto;width:auto;overflow:hidden;opacity:0;transition:opacity 2000ms ease;pointer-events:none;display:flex;align-items:center;justify-content:center'});
    const tor = el('img',{src:'assets/tor.png', alt:'Tor', style:'height:100%;width:auto;'});
    tor.addEventListener('error', ()=>{ torWrap.style.display='none'; });
    tor.addEventListener('load', ()=>{
      try{
        // match the reference portrait pixel size once (no resize handler)
        const ref = shalendra || portrait;
        if(ref){
          try{
            const r = ref.getBoundingClientRect();
            const scale = 1.08;
            torWrap.style.width = Math.round(r.width * scale) + 'px';
            torWrap.style.height = Math.round(r.height * scale) + 'px';
          }catch(e){}
        }
      }catch(e){}
      setTimeout(()=>{ try{ torWrap.style.opacity = '0.9'; }catch(e){} }, 2400);
    });
    torWrap.appendChild(tor);
    container.appendChild(torWrap);
  }

  // Adjust portrait vertical (bottom) positions based on the player's choice so layout reflects the decision
  try{
    if(choice === 'live'){
      // lower portraits a bit to make room for Tor in the center (pixel-independent)
      portrait.style.bottom = '-82%';
      shalendra.style.bottom = '-82%';
      volo.style.bottom = '-82%';
    } else {
      // default positions when wizard was killed or absent
      portrait.style.bottom = '-180%';
      shalendra.style.bottom = '-180%';
      volo.style.bottom = '-180%';
    }
  }catch(e){}

  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:1000px;width:90%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:0vh;'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  let text = '';
  let btnLabel = '';
  if(choice === 'live'){
    text = `
A short, armored figure emerges from the shadows, bearing the sigil of the Heroes of Faerûn. His presence is steady, authoritative.|
“I am Tor,” he says. “And you have done well.” He looks down at the captured Red Wizard with clear disdain.|
“Alive, he can be questioned. Interrogated. If others still serve Szass Tam, we will find them through him.”|
Tor then turns back to Cree, his expression hardening. “But this victory comes with troubling news. What this wizard was doing is only part of a larger threat.”|
He pauses, then reaches to his side and produces a massive warhammer, its surface etched with ancient runes.|
“Return to Syranna. She will explain the rest.” He places the weapon into your hands.|
“And take this. You will need it.”
`;
    btnLabel = 'Take Whelm';
  } else {
    text = `
The Red Wizard collapses, his magic finally silenced.|
The air grows still.|
You take the heavy pouch—coin taken from darker deeds.|
No one comes. No one speaks.|
The moment passes, and the road ahead remains unchanged.|
Return to Syranna and report the job complete. 
`;
    btnLabel = 'Take 5 gold';
  }

  const sentences = splitNarrative(text, '|');
  const pEls = sentences.map(s => { const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]); inner.appendChild(p); return p; });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

  function startReveal(){ let totalDelay = 0; pEls.forEach((p, idx) => { const base = 700; const extra = Math.min(2000, (p.textContent.length || 0) * 12); const revealDelay = base + extra; totalDelay += revealDelay; setTimeout(()=>{ try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){} if(idx === pEls.length - 1){ setTimeout(revealButtons, 900); } }, totalDelay); totalDelay += 300; }); if(pEls.length === 0) revealButtons(); }

  function revealButtons(){ actionBtn.style.display = 'inline-block'; }

  const actionBtn = el('button',{class:'choice-action-btn', style:'display:none;z-index:10040;position:fixed;left:50%;transform:translateX(-50%);bottom:28px'},[ btnLabel ]);
  actionBtn.addEventListener('click', ()=>{
    try{
      if(choice === 'live' && ctx && ctx.isAdventure && ctx.meta){
        try{ ctx.meta.ownedLegendary = ctx.meta.ownedLegendary || []; }catch(e){}
        if(!ctx.meta.ownedLegendary.includes('whelm')){
          try{ ctx.meta.ownedLegendary.push('whelm'); }catch(e){}
          try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
          try{ if(typeof ctx.setMessage === 'function') ctx.setMessage('Received Whelm'); }catch(e){}
        }
      } else if(choice === 'kill' && ctx && ctx.isAdventure && ctx.meta){
        try{ ctx.meta.gold = (typeof ctx.meta.gold === 'number') ? ctx.meta.gold : 0; }catch(e){}
        try{ ctx.meta.gold += 5; }catch(e){}
        try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
        try{ if(typeof ctx.setMessage === 'function') ctx.setMessage('Gained 5 gold'); }catch(e){}
      }
    }catch(e){}
    try{
      // Persist adventure-temp changes and continue to Scene 3
      try{ if(ctx && ctx.meta) saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
      navigate('adventure_daggerford_scene_3', { ctx });
    }catch(e){ console.error('Failed to navigate to scene 3:', e); }
  });

  container.appendChild(actionBtn);

  // Add music controls
  addMusicControls(root);

  root.appendChild(container);
  setTimeout(startReveal, 2600);
}
