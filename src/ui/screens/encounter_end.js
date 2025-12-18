import { el } from '../renderer.js';

export function renderEncounterEnd(root, ctx){
  const enemy = ctx.enemy || {};
  const enemyId = enemy.id || enemy.name || 'Enemy';
  const enemyName = enemy.name || enemyId;

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

  // Reward display
  const rewardStat = el('div',{class:'end-stat'},['IP gained: '+(ctx.reward||0)]);
  summary.appendChild(rewardStat);

  container.appendChild(summary);

  const btnRow = el('div',{class:'end-btns'},[]);
  const cont = el('button',{class:'btn end-back-btn'},['Continue']);
  cont.addEventListener('click',()=>{ if(ctx.onContinue) ctx.onContinue(); });
  btnRow.appendChild(cont);
  container.appendChild(btnRow);

  root.appendChild(container);
}
