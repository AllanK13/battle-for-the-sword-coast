import { el } from '../renderer.js';
import { AudioManager } from '../../engine/audio.js';
import { initMusic } from '../../engine/helpers.js';

export function renderEnd(root, ctx){
  const rs = ctx.runSummary || { defeated: [], diedTo: null, ipEarned: 0 };
  const container = el('div',{class:'end-screen'},[]);
  container.appendChild(el('h1',{class:'end-title'},['Run Summary']));

  const summary = el('div',{class:'end-summary panel'},[]);
  if (ctx.showIp !== false) {
    summary.appendChild(el('div',{class:'end-stat'},['IP earned: '+(rs.ipEarned||0)]));
  }
  // V interest display (if applicable)
  if(ctx.vInterest && Number(ctx.vInterest) > 0){
    summary.appendChild(el('div',{class:'end-stat'},['V interest earned: '+Number(ctx.vInterest)]));
  }
  summary.appendChild(el('div',{class:'end-stat'},['Enemies defeated:']));
  const ul = el('ul',{class:'end-list'},[]);
  (rs.defeated||[]).forEach(id=>{
    const name = (ctx.data && ctx.data.enemies) ? (ctx.data.enemies.find(e=>e.id===id)||{}).name || id : id;
    ul.appendChild(el('li',{},[name]));
  });
  summary.appendChild(ul);
  if(rs.diedTo){
    const diedName = (ctx.data && ctx.data.enemies) ? (ctx.data.enemies.find(e=>e.id===rs.diedTo)||{}).name || rs.diedTo : rs.diedTo;
    summary.appendChild(el('div',{class:'end-stat end-died'},['Died to: '+diedName]));
    // show last combat history message (damage log) if provided in context
    try{
      const lastMsg = ctx.lastHistoryMessage || ctx.lastBattleMessage || null;
      if(lastMsg){
        summary.appendChild(el('div',{class:'end-stat end-last-msg'},['Last hit: '+lastMsg]));
      }
    }catch(e){ /* ignore */ }
  } else {
    summary.appendChild(el('div',{class:'end-stat end-survived'},['You survived the run']));
  }

  container.appendChild(summary);

  const btnRow = el('div',{class:'end-btns'},[]);
  const back = el('button',{class:'btn end-back-btn'},['Back to Menu']);
  back.addEventListener('click',()=> ctx.onRestart());
  btnRow.appendChild(back);
  container.appendChild(btnRow);

  root.appendChild(container);

  // When showing the end screen, play end music (stop previous audio first)
  try{
    initMusic('end.mp3', { autoplay: true, loop: false });
  }catch(e){ /* ignore audio init failures */ }

  // Add music controls
  addMusicControls(root);
}
