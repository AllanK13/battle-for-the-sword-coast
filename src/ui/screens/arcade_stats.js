import { el } from '../renderer.js';
import { createMeta, saveMeta, saveMetaIfAllowed, saveSlot, loadSlot, deleteSlot } from '../../engine/meta.js';
import { addMusicControls } from '../music-controls.js';

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
  const enemiesList = (ctx && ctx.data && ctx.data.enemies) ? ctx.data.enemies : [];
  let furthestDisplay = 'N/A';
  if(typeof meta.furthestReachedEnemy !== 'undefined' && meta.furthestReachedEnemy !== null){
    const f = meta.furthestReachedEnemy;
    if(typeof f === 'number'){
      const e = enemiesList[f];
      if(e) furthestDisplay = e.name || e.id || String(f);
      else furthestDisplay = String(f);
    }else{
      const match = enemiesList.find(en => en.id === f || en.name === f);
      if(match) furthestDisplay = match.name || match.id || String(f);
      else furthestDisplay = String(f);
    }
  }
  overview.appendChild(el('div',{class:'stats-overview-item'},['Furthest reached enemy: ', el('strong',{},[furthestDisplay]) ]));
  container.appendChild(overview);

  const charUsage = meta.characterUsage || {};
  const baseCards = (ctx && ctx.data && ctx.data.cards) ? ctx.data.cards : [];
  const legendaryCards = (ctx && ctx.data && ctx.data.legendary) ? (ctx.data.legendary.filter(l => l && typeof l.hp === 'number')) : [];
  const cards = legendaryCards.concat(baseCards);
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

  const baseSummons = (ctx && ctx.data && ctx.data.summons) ? ctx.data.summons : [];
  const legendarySummons = (ctx && ctx.data && ctx.data.legendary) ? ctx.data.legendary.filter(l => l && typeof l.hp !== 'number') : [];
  const summonsData = baseSummons.concat(legendarySummons);
  const summonUsage = (meta.totalSummonUsage && Object.keys(meta.totalSummonUsage).length>0) ? meta.totalSummonUsage : (meta.summonUsage || {});
  const summonNameCounts = {};
  // Only display summons usage if there are any recorded usages (>0)
  Object.entries(summonUsage).forEach(([id, cnt])=>{
    if(!cnt || Number(cnt) <= 0) return;
    const s = summonsData.find(x=> x && x.id===id) || summonsData.find(x=> x && x.name===id);
    const display = (s && s.name) ? s.name : id;
    summonNameCounts[display] = (summonNameCounts[display] || 0) + (cnt||0);
  });
  if(Object.keys(summonNameCounts).length > 0){
    container.appendChild(el('h3',{class:'section-title'},['Summons']));
    container.appendChild(kvList(summonNameCounts));
  }

  const enemies = enemiesList;
  const defeatCounts = {};
  const victoryCounts = {};
  const metaDefObj = meta.enemyDefeatCounts || {};
  const metaVicObj = meta.enemyVictoryCounts || {};
  enemies.forEach((e, idx)=>{
    const id = e.id || String(idx);
    const name = e.name || id;
    const display = name;
    const countDef = (metaDefObj[id] || 0) + (metaDefObj[name] || 0);
    const countVic = (metaVicObj[id] || 0) + (metaVicObj[name] || 0);
    defeatCounts[display] = countDef;
    victoryCounts[display] = countVic;
  });
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

  // Best (Lowest HP) section (moved here so it appears after Enemies Defeated)
  container.appendChild(el('h3',{class:'section-title'},['Best Score (Lowest HP)']));
  const lowestHP = meta.enemyLowestHP || {};
  const lowestHPDisplay = {};
  enemies.forEach((e, idx)=>{
    const id = e.id || String(idx);
    const name = e.name || id;
    const display = name;
    const hpVal = lowestHP[id] !== undefined ? lowestHP[id] : lowestHP[name];
    if(hpVal !== undefined) lowestHPDisplay[display] = hpVal + ' HP';
  });
  // Include any tracked enemies not in enemies list
  Object.keys(lowestHP).forEach(k=>{
    const matched = enemies.some((e, idx)=> (k === e.id || k === e.name || k === String(idx)));
    if(!matched) lowestHPDisplay[k] = lowestHP[k] + ' HP';
  });
  const filteredLowestHP = {};
  Object.entries(lowestHPDisplay).forEach(([k,v])=>{ if(v !== undefined) filteredLowestHP[k]=v; });
  if(Object.keys(filteredLowestHP).length > 0){
    container.appendChild(kvList(filteredLowestHP));
  } else {
    container.appendChild(el('div',{class:'muted',style:'padding:8px'},['No records yet']));
  }

  container.appendChild(el('h3',{class:'section-title'},['Enemy TPKs']));
  const filteredVictory = {};
  Object.entries(victoryCounts).forEach(([k,v])=>{ if(Number(v) > 0) filteredVictory[k]=v; });
  container.appendChild(kvList(filteredVictory));

  const back = el('button',{class:'btn stats-back-btn', style:'position:absolute;right:12px;top:8px'},['Back']);
  back.addEventListener('click', ()=>{ if(ctx && ctx.onBack) ctx.onBack(); else if(window.navigate) window.navigate('arcade_start'); });

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
      if(ctx && ctx.onBack) ctx.onBack(); else if(window.navigate) window.navigate('arcade_start');
    }catch(e){ alert('Failed to delete save: '+(e&&e.message)); }
  });
  const footer = el('div',{style:'display:flex;justify-content:flex-start;align-items:center;margin-top:8px'},[]);
  footer.appendChild(del);
  container.appendChild(footer);

  container.appendChild(el('h3',{class:'section-title'},['Save Slots']));
  const slotsPanel = el('div',{class:'panel save-slots', style:'display:flex;gap:8px;flex-wrap:wrap'},[]);

  function formatSlotInfo(slotData){
    if(!slotData) return 'Empty';
    try{
      const d = new Date(slotData.savedAt || 0);
      const runsPart = (slotData.meta && slotData.meta.runs !== undefined) ? ('Runs: '+(slotData.meta.runs||0)) : '';
      const namePart = slotData.name ? (String(slotData.name) + ' — ') : '';
      let bestPart = '';
      if(slotData.meta && slotData.meta.enemyLowestHP){
        const lowest = Object.entries(slotData.meta.enemyLowestHP).sort((a,b)=>a[1]-b[1])[0];
        if(lowest) bestPart = ` — Best: ${lowest[0]} ${lowest[1]} HP`;
      }
      return namePart + (runsPart ? (runsPart + bestPart + ' — ' + d.toLocaleString()) : d.toLocaleString());
    }catch(e){ return 'Saved'; }
  }

  for(let i=1;i<=3;i++){
    const slotRaw = loadSlot(i);
    const box = el('div',{class:'save-slot panel', style:'width:220px;padding:8px;display:flex;flex-direction:column;gap:6px'},[]);
    const title = el('div',{class:'slot-title', style:'font-weight:600'},[ 'Slot '+i ]);
    const info = el('div',{class:'muted'},[ formatSlotInfo(slotRaw) ]);
    const btnRow = el('div',{style:'display:flex;gap:6px;'},[]);
    const btnSave = el('button',{class:'btn save-btn'},['Save']);
    const btnLoad = el('button',{class:'btn load-btn'},['Load']);
    const btnDelete = el('button',{class:'btn delete-btn'},['Delete']);

    btnSave.addEventListener('click', ()=>{
      const ok = slotRaw ? confirm('Overwrite save slot '+i+'?') : true;
      if(!ok) return;
      // Prompt the user for a name after clicking Save
      const promptDefault = (slotRaw && slotRaw.name) ? slotRaw.name : '';
      const entered = window.prompt('Enter name for slot '+i+':', promptDefault);
      if(entered === null) return; // cancelled
      const nameVal = (String(entered).trim() === '') ? undefined : String(entered).trim();
      const res = saveSlot(i, ctx.meta, nameVal);
      if(!res) return alert('Failed to save slot');
      // update info in-place and stay on stats screen
      const newData = loadSlot(i);
      info.textContent = formatSlotInfo(newData);
      alert('Saved to slot '+i);
    });

    btnLoad.addEventListener('click', ()=>{
      if(!slotRaw) return alert('Slot '+i+' is empty');
      const ok = confirm('Load save from slot '+i+'? This will replace your current save.');
      if(!ok) return;
      try{
        const payload = loadSlot(i);
        if(!payload || !payload.meta) return alert('Invalid save data');
        if(ctx && ctx.meta){ Object.keys(ctx.meta).forEach(k=>{ delete ctx.meta[k]; }); Object.entries(payload.meta).forEach(([k,v])=> ctx.meta[k]=v); }
        try{ saveMetaIfAllowed(ctx.meta, ctx); }catch(e){}
        alert('Loaded slot '+i);
        // refresh displayed slot info in-place
        const loaded = loadSlot(i);
        info.textContent = formatSlotInfo(loaded);
      }catch(e){ alert('Failed to load save: '+(e&&e.message)); }
    });

    btnDelete.addEventListener('click', ()=>{
      if(!slotRaw) return alert('Slot '+i+' is already empty');
      const ok = confirm('Delete save in slot '+i+'?');
      if(!ok) return;
      const res = deleteSlot(i);
      if(!res) return alert('Failed to delete slot');
      info.textContent = formatSlotInfo(null);
      alert('Deleted slot '+i);
    });

    btnRow.appendChild(btnSave);
    btnRow.appendChild(btnLoad);
    btnRow.appendChild(btnDelete);
    box.appendChild(title);
    box.appendChild(info);
    box.appendChild(btnRow);
    slotsPanel.appendChild(box);
  }

  container.appendChild(slotsPanel);

  wrapper.appendChild(back);
  wrapper.appendChild(container);
  // Add music controls
  addMusicControls(wrapper);

  root.appendChild(wrapper);
}
