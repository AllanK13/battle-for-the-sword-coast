import { el } from '../../../renderer.js';
import { navigate } from '../../../router.js';
import { initMusic } from '../../../../engine/helpers.js';
import { AudioManager } from '../../../../engine/audio.js';
import { splitNarrative } from '../text_split.js';
import { addMusicControls } from '../../../music-controls.js';
import { attachCinematicAdvance } from '../cinematic.js';

export function renderAdventureDaggerford(root, ctx = {}){
  const container = el('div',{class:'adventure-cinematic', style:'position:relative;width:100%;height:100%;background:transparent;overflow:visible;color:#fff;display:flex;align-items:center;justify-content:center'},[]);

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

  // Semi-opaque black overlay to ensure text readability (start hidden, fade in later)
  const overlay = el('div',{style:'position:absolute;left:0;top:0vh;width:100%;height:100%;z-index:6;pointer-events:none;opacity:0;transition:opacity 1200ms ease;background:linear-gradient(rgba(0, 0, 0, 0.85), rgba(0,0,0,0.85) 100%)'},[]);
  container.appendChild(overlay);

  // Fade the overlay in later to avoid an initial black flash
  setTimeout(()=>{ try{ overlay.style.opacity = '1'; }catch(e){} }, 2200);

  // Character portrait (Cree) - positioned at bottom left, outside text overlay but above background
  const portrait = el('img',{src:'assets/cree_teen.png', alt:'Cree', style:'position:absolute;left:8%;bottom:-180%;z-index:7;max-height:50vh;width:auto;opacity:0;transition:opacity 2000ms ease;pointer-events:none'});
  portrait.addEventListener('error', ()=>{ portrait.style.display='none'; });
  portrait.addEventListener('load', ()=>{ setTimeout(()=>{ try{ portrait.style.opacity = '0.9'; }catch(e){} }, 2400); });
  container.appendChild(portrait);

  // Text area (centered column) — nudged down so it sits lower within the cinematic overlay
  const textWrap = el('div',{style:'position:relative;z-index:10;max-width:1000px;width:90%;height:60%;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;padding:28px;margin-top:0vh;'},[]);
  const inner = el('div',{style:'color:#eee;font-size:20px;line-height:1.6;padding-bottom:24px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;'},[]);
  // Sentences will be revealed one-after-another; each sentence on its own line
  const text = `
Daggerford, the largest city north of Baldur’s Gate, rose to prominence in the wake of Waterdeep’s fall.|
Guided by the benevolence of the Heroes of Faerûn, the city has grown into a bustling metropolis, its markets overflowing with rare goods and impossible wonders—drawing merchants, mercenaries, and fortune-seekers from across the Sword Coast.|
Cree is only just beginning his journey, lured to the city by the promise of opportunity. Before he can even reach the tavern, trouble finds him first…
`;
  // Use custom delimiter `|` when present, otherwise fall back to sentence splitting
  const sentences = splitNarrative(text, '|');
  const pEls = sentences.map(s => {
    const p = el('p',{style:'margin:0;opacity:0;transform:translateY(6px);transition:opacity 750ms ease, transform 750ms ease;max-width:100%' },[s]);
    inner.appendChild(p);
    return p;
  });
  textWrap.appendChild(inner);
  container.appendChild(textWrap);

  // Attach left-click advancement helper
  attachCinematicAdvance(container, pEls, { onComplete: ()=>{ try{ if(typeof revealContinue === 'function') revealContinue(); }catch(e){} } });

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
      totalDelay += 300;
    });
    // If no paragraphs, reveal immediately
    if(pEls.length === 0) revealContinue();
  }

  function revealContinue(){
    continueBtn.style.display = 'inline-block';
  }

  // Kick off the sequential reveal after mount so layout is ready (start after overlay fade)
  setTimeout(startReveal, 2600);

  // Continue button placed at bottom of screen (shares style with Venture Forth)
  const continueBtn = el('button',{class:'start-run-btn', style:'display:none;z-index:10040;background:linear-gradient(180deg,#2563eb,#1e40af);color:#fff;border:none;box-shadow:0 6px 16px rgba(16,24,40,0.2);padding:12px 18px;border-radius:8px'},['Continue']);
  continueBtn.addEventListener('click', ()=>{
    // play the same boom flourish as Venture Forth
    try{
      // Use AudioManager so SFX respects global SFX settings and multipliers
      try{ AudioManager.playSfx(['./assets/music/boom.mp3'], { volume: 0.5 }); }catch(e){}
    }catch(e){}
    try{
      if(ctx && typeof ctx.onCinematicComplete === 'function') ctx.onCinematicComplete();
      else {
        console.warn('No onCinematicComplete handler; returning to adventure start to begin proper run');
        navigate('adventure_start');
      }
    }catch(e){ console.warn('onCinematicComplete failed', e); navigate('adventure_start'); }
  });
  container.appendChild(continueBtn);

  // Play town music (fade handled by AudioManager)
  try{
    initMusic('town.mp3');
    // Ensure playback after user gesture if blocked
    try{ AudioManager.play(); }catch(e){}
  }catch(e){}

  // Add music controls
  addMusicControls(container);

  // Attach to root
  root.appendChild(container);
  return container;
}
