import { el } from '../renderer.js';
import { AudioManager } from '../../engine/audio.js';
import { navigate } from '../router.js';

export function renderAdventureDaggerford(root, ctx = {}){
  const container = el('div',{class:'adventure-cinematic', style:'position:relative;width:100%;height:100%;background:#000;overflow:visible;color:#fff;display:flex;align-items:center;justify-content:center'},[]);

  // Background image (fade-in) - use fixed pixel size after load to prevent resizing on window resize
     const bg = el('img',{src:'assets/adventure/daggerford_street.jpg', alt:'Daggerford Streets', style:'position:absolute;left:50%;top:0;width:120vw;height:100vh;object-fit:auto;object-position:center top;transform-origin:top center;transform:translateX(-50%) scale(1.06);opacity:0;transition:opacity 4200ms ease, transform 4200ms ease'});
  bg.addEventListener('error', ()=>{ bg.src='assets/adventure/daggerford_street.jpg'; });
  // Set fixed pixel dimensions once the image has loaded so it won't change on window resize
  bg.addEventListener('load', ()=>{
    try{
      const w = bg.naturalWidth || 1200;
      const h = bg.naturalHeight || 800;
      bg.style.width = w + 'px';
      bg.style.height = h + 'px';
    }catch(e){}
  });
  container.appendChild(bg);
  // fade and subtly zoom in (more tall crop) slightly after mount
    setTimeout(()=>{ try{ bg.style.opacity = '1'; bg.style.transform = 'translateX(-50%) scale(1.08)'; }catch(e){} }, 120);

  // Semi-opaque black overlay to ensure text readability (shifted down)
  const overlay = el('div',{style:'position:absolute;left:0;top:8vh;width:100%;height:calc(100% - 8vh);background:linear-gradient(rgba(0,0,0,0.85),rgba(0,0,0,0.6))'},[]);
  container.appendChild(overlay);

  // Floating music control (matches other screens)
  try{
    const musicBtn = el('button',{class:'btn music-btn floating icon', style:'position:fixed;right:18px;bottom:36px;z-index:10030;height:40px;display:flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:6px;background:linear-gradient(180deg,#10b981,#047857);color:#fff;border:1px solid rgba(0,0,0,0.12);font-size:22px', title:'Music'},[ el('span',{style:'font-size:22px;line-height:1;display:inline-block'},[ AudioManager.isEnabled ? (AudioManager.isEnabled() ? '🔊' : '🔈') : '🔈' ]) ]);
    const musicPanel = el('div',{class:'panel music-panel', style:'position:fixed;right:18px;bottom:76px;z-index:10030;display:none;padding:8px;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,0.25)'},[]);
    const volLabel = el('div',{},['Volume']);
    const volInput = el('input',{type:'range', min:0, max:100, value: String(Math.round((AudioManager.getVolume ? AudioManager.getVolume() : 0.6) * 100)), style:'width:160px;display:block'});
    volInput.addEventListener('input', (ev)=>{ const v = Number(ev.target.value || 0) / 100; try{ AudioManager.setVolume(v); }catch(e){} });
    function syncControls(){ try{ const span = musicBtn.querySelector('span'); if(span) span.textContent = (AudioManager.isEnabled ? (AudioManager.isEnabled() ? '🔊' : '🔈') : (AudioManager.isEnabled() ? '🔊' : '🔈')); const v = Math.round((AudioManager.getVolume ? AudioManager.getVolume() : 0.6) * 100); volInput.value = String(v); }catch(e){} }
    musicPanel.appendChild(volLabel);
    musicPanel.appendChild(volInput);
    let panelTimer = null;
    function showPanel(){ syncControls(); musicPanel.style.display = 'block'; if(panelTimer) clearTimeout(panelTimer); panelTimer = setTimeout(()=>{ musicPanel.style.display = 'none'; panelTimer = null; }, 4000); }
    musicBtn.addEventListener('click', ()=>{ try{ const on = AudioManager.toggle(); const span = musicBtn.querySelector('span'); if(span) span.textContent = on ? '🔊' : '🔈'; }catch(e){} syncControls(); showPanel(); });
    musicBtn.addEventListener('mouseover', showPanel);
    musicPanel.addEventListener('mouseover', ()=>{ if(panelTimer) clearTimeout(panelTimer); });
    musicPanel.addEventListener('mouseleave', ()=>{ if(panelTimer) clearTimeout(panelTimer); panelTimer = setTimeout(()=>{ musicPanel.style.display='none'; panelTimer=null; }, 1000); });
    container.appendChild(musicBtn);
    container.appendChild(musicPanel);
  }catch(e){ }

  // Text area (centered column) — nudged down so it sits lower within the cinematic overlay
  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:900px;width:80%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:8vh;'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  // Sentences will be revealed one-after-another; each sentence on its own line
  const placeholder = `Daggerford, the largest city north of Baldur’s Gate, rose in prominence after the fall of Waterdeep. Ushered in by the benevolence of the Heroes of Faerun, this bustling metropolis now contains a thriving market full of every wondrous item imaginable, attracting merchants and adventurers alike. Cree is a young adventurer, looking to start his journey in none other than the greatest city on the Sword Coast. On his way to the tavern, he ran into some trouble…`;
  // Split into sentences (keep punctuation). This is a lightweight split and covers typical sentence endings.
  const sentences = (placeholder.match(/[^\.\!\?…]+[\.\!\?…]*/g) || []).map(s => s.trim()).filter(Boolean);
  const pEls = sentences.map(s => {
    const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]);
    inner.appendChild(p);
    return p;
  });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

  // Continue button placed at bottom of screen (shares style with Venture Forth)
  const continueBtn = el('button',{class:'start-run-btn', style:'display:none;z-index:10040'},['Continue']);
  continueBtn.addEventListener('click', ()=>{
    // play the same boom flourish as Venture Forth
    try{
      const sfx = new Audio('./assets/music/boom.mp3');
      try{
        const userVol = (AudioManager && AudioManager.getVolume) ? (AudioManager.getVolume() || 1) : 1;
        const master = (AudioManager && typeof AudioManager.masterMultiplier === 'number') ? AudioManager.masterMultiplier : 1;
        sfx.volume = Math.max(0, Math.min(1, 0.8 * userVol * master));
      }catch(e){}
      const p = sfx.play(); if(p && p.catch) p.catch(()=>{});
    }catch(e){}
    try{
      if(ctx && typeof ctx.onCinematicComplete === 'function') ctx.onCinematicComplete();
      else navigate('battle');
    }catch(e){ navigate('battle'); }
  });
  container.appendChild(continueBtn);

  // Play town music (fade handled by AudioManager)
  try{
    const musicCandidates = ['./assets/music/town.mp3','assets/music/town.mp3','/assets/music/town.mp3'];
    AudioManager.init(musicCandidates[0], { autoplay:true, loop:true });
    // Ensure playback after user gesture if blocked
    try{ AudioManager.play(); }catch(e){}
  }catch(e){}

  // Reveal paragraphs sequentially with a variable delay per paragraph
  function startReveal(){
    let totalDelay = 0;
    pEls.forEach((p, idx) => {
      // base reveal time grows with paragraph length for slower, readable reveal
      const base = 700; // ms for short paragraphs
      const extra = Math.min(2000, (p.textContent.length || 0) * 12);
      const revealDelay = base + extra;
      totalDelay += revealDelay;
      setTimeout(()=>{
        try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){}
        // if last paragraph, schedule showing Continue after its transition
        if(idx === pEls.length - 1){ setTimeout(revealContinue, 900); }
      }, totalDelay);
      // small gap between paragraphs
      totalDelay += 220;
    });
    // If no paragraphs, reveal immediately
    if(pEls.length === 0) revealContinue();
  }

  function revealContinue(){
    continueBtn.style.display = 'inline-block';
  }

  // Kick off the sequential reveal after mount so layout is ready
  setTimeout(startReveal, 200);

  // Attach to root
  root.appendChild(container);
  return container;
}
