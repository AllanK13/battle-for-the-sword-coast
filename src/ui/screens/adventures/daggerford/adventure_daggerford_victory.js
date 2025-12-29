import { el } from '../../../renderer.js';
import { navigate } from '../../../router.js';
import { initMusic } from '../../../../engine/helpers.js';
import { saveMetaIfAllowed } from '../../../../engine/meta.js';
import { AudioManager } from '../../../../engine/audio.js';
import { addMusicControls } from '../../../music-controls.js';

export function renderAdventureDaggerfordVictory(root, params = {}){
  const ctx = (params && params.ctx) ? params.ctx : (params || {});

  const container = el('div',{class:'adventure-cinematic', style:'position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;overflow:hidden'},[]);

  // Simple victory title and summary
  const panel = el('div',{style:'z-index:10;max-width:900px;width:86%;padding:24px;background:rgba(0,0,0,0.6);border-radius:10px;display:flex;flex-direction:column;gap:12px;align-items:center'},[]);
  panel.appendChild(el('h1',{style:'margin:0;padding:0;font-size:34px'},['Victory — Szass Tam defeated']));
  const summaryText = (params && params.runSummary && Array.isArray(params.runSummary.defeated)) ? ('You defeated: '+params.runSummary.defeated.join(', ')) : '';
  panel.appendChild(el('div',{style:'font-size:22px;opacity:0.95'},[summaryText || 
    'Cree and his party defeated Szass Tam for the second time. The Heroes of Faerûn established Cree Day in honor of his heroics.'
]));

  const btnRow = el('div',{style:'display:flex;gap:12px;margin-top:8px'},[]);
  const cont = el('button',{class:'start-run-btn'},['Continue']);
  cont.addEventListener('click', ()=>{
    try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
    navigate('adventure_start');
  });
  btnRow.appendChild(cont);
  panel.appendChild(btnRow);

  container.appendChild(panel);

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
