import { el } from '../renderer.js';
import { createMeta, saveMeta } from '../../engine/meta.js';

function kvList(obj){
  const box = el('div', {class:'stats-list'}, []);
  if(!obj) return box;
  Object.keys(obj).sort((a,b)=> (obj[b]-obj[a]) ).forEach(k=>{
    const row = el('div', {class:'stats-row'}, [
      el('div',{class:'stats-key'},[k]),
      el('div',{class:'stats-val'},[String(obj[k])])
    ]);
    box.appendChild(row);
  });
  return box;
}

export function renderStats(root, ctx){
  const wrapper = el('div',{style:'position:relative;padding-top:48px'},[]);
  const container = el('div',{class:'panel stats-screen'},[]);
  container.appendChild(el('h2',{class:'stats-title'},['Statistics']));
  const meta = (ctx && ctx.meta) ? ctx.meta : {};

  const overview = el('div',{class:'stats-overview panel muted'},[]);
  overview.appendChild(el('div',{class:'stats-overview-item'},['Runs: ', el('strong',{},[String(meta.runs || 0)])]));
  overview.appendChild(el('div',{class:'stats-overview-item'},['Encounters beaten: ', el('strong',{},[String(meta.encountersBeaten || 0)])]));
  overview.appendChild(el('div',{class:'stats-overview-item'},['Furthest reached enemy: ', el('strong',{},[String(meta.furthestReachedEnemy != null ? meta.furthestReachedEnemy : 'N/A')]) ]));
  container.appendChild(overview);

  // characters
  const charUsage = meta.characterUsage || {};
  // Map character IDs to names from data and sum counts by name
  const cards = (ctx && ctx.data && ctx.data.cards) ? ctx.data.cards : [];
  const charNameCounts = {};
  Object.entries(charUsage).forEach(([id, cnt])=>{
    const card = cards.find(c=> c.id===id) || cards.find(c=> c.name===id);
    const display = (card && card.name) ? card.name : id;
    charNameCounts[display] = (charNameCounts[display] || 0) + (cnt||0);
  });
  const mostUsed = Object.keys(charNameCounts).sort((a,b)=> (charNameCounts[b]||0)-(charNameCounts[a]||0))[0] || null;
  container.appendChild(el('h3',{class:'section-title'},['Characters']));
  const mostUsedRow = el('div',{class:'panel most-used'},[ el('span',{style:'margin-right:8px'},['Most used:']), el('strong',{},[mostUsed || 'N/A']) ]);
  container.appendChild(mostUsedRow);
  container.appendChild(kvList(charNameCounts));

  // summons
  // summons: map summon IDs to names and sum counts by name
  const summonsData = (ctx && ctx.data && ctx.data.summons) ? ctx.data.summons : [];
  const summonUsage = meta.summonUsage || {};
  const summonNameCounts = {};
  Object.entries(summonUsage).forEach(([id, cnt])=>{
    const s = summonsData.find(x=> x.id===id) || summonsData.find(x=> x.name===id);
    const display = (s && s.name) ? s.name : id;
    summonNameCounts[display] = (summonNameCounts[display] || 0) + (cnt||0);
  });
  container.appendChild(el('h3',{class:'section-title'},['Summons']));
  container.appendChild(kvList(summonNameCounts));

  // enemies defeated / victories — consolidate id/name and always list all enemies
  const enemies = (ctx && ctx.data && ctx.data.enemies) ? ctx.data.enemies : [];
  const defeatCounts = {};
  const victoryCounts = {};
  const metaDefObj = meta.enemyDefeatCounts || {};
  const metaVicObj = meta.enemyVictoryCounts || {};
  // populate from game enemy list (use name as display, sum id+name counts)
  enemies.forEach((e, idx)=>{
    const id = e.id || String(idx);
    const name = e.name || id;
    const display = name;
    const countDef = (metaDefObj[id] || 0) + (metaDefObj[name] || 0);
    const countVic = (metaVicObj[id] || 0) + (metaVicObj[name] || 0);
    defeatCounts[display] = countDef;
    victoryCounts[display] = countVic;
  });
  // include any extra keys present in meta that don't match known enemy id/name
  Object.keys(metaDefObj).forEach(k=>{
    const matched = enemies.some((e, idx)=> (k === e.id || k === e.name || k === String(idx)));
    if(!matched) defeatCounts[k] = metaDefObj[k];
  });
  Object.keys(metaVicObj).forEach(k=>{
    const matched = enemies.some((e, idx)=> (k === e.id || k === e.name || k === String(idx)));
    if(!matched) victoryCounts[k] = metaVicObj[k];
  });

  container.appendChild(el('h3',{class:'section-title'},['Enemies Defeated']));
  const filteredDefeat = {};
  Object.entries(defeatCounts).forEach(([k,v])=>{ if(Number(v) > 0) filteredDefeat[k]=v; });
  container.appendChild(kvList(filteredDefeat));

  container.appendChild(el('h3',{class:'section-title'},['Enemy TPKs']));
  const filteredVictory = {};
  Object.entries(victoryCounts).forEach(([k,v])=>{ if(Number(v) > 0) filteredVictory[k]=v; });
  container.appendChild(kvList(filteredVictory));

  const back = el('button',{class:'btn stats-back-btn', style:'position:absolute;right:12px;top:8px'},['Back']);
  back.addEventListener('click', ()=>{ if(ctx && ctx.onBack) ctx.onBack(); else if(window.navigate) window.navigate('start'); });

  // Delete Save button (bottom-left)
  const del = el('button',{class:'btn delete-save-btn'},['Delete Save']);
  del.addEventListener('click', ()=>{
    const ok = confirm('Delete local save? This will reset IP, unlocked cards, and stats.');
    if(!ok) return;
    try{
      if(ctx && ctx.meta){
        const fresh = createMeta();
        // clear existing meta object and copy fresh values to preserve reference
        Object.keys(ctx.meta).forEach(k=>{ delete ctx.meta[k]; });
        Object.entries(fresh).forEach(([k,v])=> ctx.meta[k]=v);
      }
      saveMeta(createMeta());
      if(ctx && ctx.onBack) ctx.onBack(); else if(window.navigate) window.navigate('start');
    }catch(e){ alert('Failed to delete save: '+(e&&e.message)); }
  });
  const footer = el('div',{style:'display:flex;justify-content:flex-start;align-items:center;margin-top:8px'},[]);
  footer.appendChild(del);
  container.appendChild(footer);

  wrapper.appendChild(back);
  wrapper.appendChild(container);
  root.appendChild(wrapper);
}
