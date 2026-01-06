import { el } from '../../../renderer.js';
import { navigate } from '../../../router.js';
import { initMusic, disableStateHandlers, restoreStateHandlers } from '../../../../engine/helpers.js';
import { saveMetaIfAllowed } from '../../../../engine/meta.js';
import { AudioManager } from '../../../../engine/audio.js';
import { addMusicControls } from '../../../music-controls.js';

export function renderAdventureDaggerfordVictory(root, params = {}){
  const ctx = (params && params.ctx) ? params.ctx : (params || {});

  // Temporarily disable state handlers so background session updates
  // cannot force navigation while the victory cinematic is visible.
  const { prevOnState, prevSetMessage } = disableStateHandlers(ctx);

  const container = el('div',{class:'adventure-cinematic victory', style:'position:relative;width:100%;height:100vh;display:flex;align-items:center;justify-content:center;color:#fff;overflow:hidden;background-image: url("assets/adventure/daggerford.png");background-size:140%;background-position:center center;background-repeat:no-repeat;' },[]);

  // Inject scoped styles for the cinematic and confetti
  const styleEl = el('style',{},[
` .adventure-cinematic.victory{ background-size:140% !important; background-position:center center; }
  .victory-panel{ z-index:10; max-width:920px; width:88%; padding:44px 48px 50px 48px; min-height:380px; background:rgba(0,0,0,0.52); border-radius:18px; display:flex; flex-direction:column; gap:16px; align-items:center; box-shadow:0 16px 48px rgba(0,0,0,0.55); backdrop-filter: blur(8px); border:1px solid rgba(255,255,255,0.04); }
  .victory-badge{ position:relative; z-index:11; display:flex; align-items:center; gap:18px; margin-bottom:6px; }
  .badge-left{ width:96px; height:96px; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#ffd86b,#ffb347); box-shadow:0 12px 30px rgba(0,0,0,0.28); font-size:40px }
  .badge-content{ display:flex; flex-direction:column; align-items:flex-start; }
  .victory-panel h1{ margin:0; padding:0; font-size:44px; letter-spacing:0.6px; color:#ffffff; }
  .victory-sub{ font-size:22px; font-weight:600; color:#ffffff; opacity:0.98; line-height:1.6; max-width:780px; margin:20px 0 10px; }
  /* remove heavy outlines; keep text crisp over image */
  .badge-title{ font-weight:900; font-size:42px; color:#ffffff; text-transform:uppercase; letter-spacing:1px }
  .badge-sub{ font-size:16px; color:#ffffff; }
  .confetti{ position:absolute; top:-8%; width:10px; height:14px; opacity:0.95; border-radius:2px; transform-origin:center; z-index:3; animation: confettiFall 2400ms linear infinite; pointer-events:none }
  @keyframes confettiFall{ 0%{ transform: translateY(-10vh) rotate(0deg); opacity:1 } 100%{ transform: translateY(120vh) rotate(360deg); opacity:0 } }

/* CTA button styling overrides to ensure blue, friendly appearance */
  .victory-cta{ background: linear-gradient(180deg,#4facfe,#00f2fe); color:#000; border:none; padding:14px 22px; border-radius:14px; font-weight:800; cursor:pointer; box-shadow:0 12px 30px rgba(3,59,93,0.18); transition:transform .12s ease, box-shadow .12s ease }
  .victory-cta:hover{ transform:translateY(-3px); box-shadow:0 16px 40px rgba(3,59,93,0.22) }
  .victory-cta:active{ transform:translateY(-1px) }
  .btn-row{ display:flex; gap:12px; margin-top:0 }
`]);
  container.appendChild(styleEl);

  // Simple victory title and summary (styled)
  const panel = el('div',{class:'victory-panel'},[]);
  const badge = el('div',{class:'victory-badge'},[
    el('div',{class:'badge-left'},['🏆']),
    el('div',{class:'badge-content'},[
      el('div',{class:'badge-title'},['Victory!'])
    ])
  ]);
  panel.appendChild(badge);
  panel.appendChild(el('h1',{style:'margin:0;padding:0;text-align:center'},['Szass Tam defeated']));
  // Summary message (do not display a generated list of defeated enemies)
  panel.appendChild(el('div',{class:'victory-sub', style:'text-align:center'},[
    'Cree and his party defeated Szass Tam for the second time. The Heroes of Faerun established Cree Day in honor of his heroics.'
  ]));

  const btnRow = el('div',{class:'btn-row'},[]);
  const cont = el('button',{class:'start-run-btn victory-cta'},['Return to Menu']);
  cont.addEventListener('click', ()=>{
    try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
    try{ restoreStateHandlers(ctx, prevOnState, prevSetMessage); }catch(e){}
    try{ navigate('menu'); }catch(e){ try{ navigate('adventure_start'); }catch(e){} }
  });
  btnRow.appendChild(cont);
  panel.appendChild(btnRow);

  container.appendChild(panel);

  // confetti pieces (decorative)
  try{
    const colors = ['#f94144','#f3722c','#f9844a','#f9c74f','#90be6d','#577590','#43aa8b'];
    for(let i=0;i<20;i++){
      const left = (Math.random()*110 - 5).toFixed(2) + '%';
      const size = 6 + Math.round(Math.random()*12);
      const delay = (Math.random()*1.6).toFixed(2) + 's';
      const dur = 1800 + Math.round(Math.random()*1600);
      const c = el('div',{class:'confetti', style:`left:${left}; width:${size}px; height:${Math.max(8,size)}px; background:${colors[i % colors.length]}; animation-duration:${dur}ms; animation-delay:${delay};`},[]);
      container.appendChild(c);
    }
  }catch(e){}

  // Play victory music at the user's current volume (do not modify global volume)
  try{
    initMusic('end.mp3', { autoplay: true, loop: false });
    try{ AudioManager && AudioManager.play && AudioManager.play(); }catch(e){}
  }catch(e){}

  // Add music controls (volume + toggle)
  addMusicControls(container);

  root.appendChild(container);
  return container;
}
