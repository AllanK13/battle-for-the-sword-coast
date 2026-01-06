import { el } from '../renderer.js';
import { AudioManager } from '../../engine/audio.js';
import { initMusic, disableStateHandlers, restoreStateHandlers } from '../../engine/helpers.js';
import { addMusicControls } from '../music-controls.js';

export function renderEncounterEnd(root, ctx){
  const enemy = ctx.enemy || {};
  const enemyId = enemy.id || enemy.name || 'Enemy';
  const enemyName = enemy.name || enemyId;

  // Ensure state handlers are disabled while this encounter-end screen
  // is visible so background updates can't force a return to the battle.
  const { prevOnState, prevSetMessage } = disableStateHandlers(ctx);

  // Play victory music for encounter completion (stop previous music first)
  try{
    initMusic('victory.mp3', { autoplay: true, loop: false });
    // Turn down victory track by 20% (use AudioManager so multiplier applies);
    try{
      const base = (AudioManager.getVolume ? AudioManager.getVolume() : (AudioManager.audio && typeof AudioManager.audio.volume === 'number' ? AudioManager.audio.volume : 1));
      ctx._victoryPrevVol = base;
      // Turn down victory track to 40% of base (quieter)
      AudioManager.setVolume(Math.max(0, base * 0.10));
    }catch(e){/* ignore */}
  }catch(e){ /* ignore audio init failures */ }

  const container = el('div',{class:'end-screen'},[]);
  container.appendChild(el('h1',{class:'end-title'},['Encounter Complete']));

  const summary = el('div',{class:'end-summary panel'},[]);

  // Killed enemy preview
  const killedWrap = el('div',{},[]);
  const killedName = el('div',{class:'end-stat'},['You killed: ' + enemyName]);
  killedWrap.appendChild(killedName);
  // try to show an image if possible (non-fatal fallback)
  if(enemy.img || enemy.image){
    const img = el('img',{src: enemy.img || enemy.image, style: 'max-width:220px;max-height:160px;margin-top:8px;border-radius:8px;'},[]);
    killedWrap.appendChild(img);
  }
  summary.appendChild(killedWrap);

  // Reward display (only show unless explicitly disabled)
  if (ctx.showIp !== false) {
    const rewardStat = el('div',{class:'end-stat'},['IP gained: '+(ctx.reward||0)]);
    summary.appendChild(rewardStat);
  }

  container.appendChild(summary);

  const btnRow = el('div',{class:'end-btns'},[]);
  const cont = el('button',{class:'btn end-back-btn'},['Continue']);
  let clicked = false;
  cont.addEventListener('click',()=>{
    // prevent double-clicks and rapid clicks
    if(clicked) return;
    clicked = true;
    cont.disabled = true;
    cont.style.opacity = '0.5';
    
    // restore volume if we reduced it for the victory track
    try{
      if(typeof ctx._victoryPrevVol !== 'undefined'){
        AudioManager.setVolume(ctx._victoryPrevVol);
        delete ctx._victoryPrevVol;
      }
    }catch(e){}
    
    // CRITICAL: Do NOT restore state handlers here!
    // Leave them suppressed and let the next screen handle its own state management.
    // This prevents any pending callbacks from firing during navigation.
    if(ctx.onContinue) {
      ctx.onContinue();
    }
  });
  btnRow.appendChild(cont);
  container.appendChild(btnRow);

  root.appendChild(container);

  // Add music controls
  addMusicControls(root);
}
