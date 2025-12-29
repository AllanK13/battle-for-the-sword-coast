import { el, cardTile } from '../renderer.js';
import { addMusicControls } from '../music-controls.js';

function section(title){ return el('div',{class:'upg-section'},[el('h2',{class:'section-title'},[title])]); }

function tierName(n){ return n===1? 'Tier 1: Common' : n===2? 'Tier 2: Uncommon' : n===3? 'Tier 3: Rare' : 'Tier 4: Very Rare'; }

export function renderUpgrades(root, ctx){
  root.innerHTML = '';
  const wrapper = el('div',{class:'upgrades-screen', style:'position:relative;padding-top:48px'},[]);
  const container = el('div',{class:'upgrades-container'},[]);
  // Back button (top-right) styled like stats back
  const back = el('button',{class:'btn stats-back-btn', style:'position:absolute;right:12px;top:8px'},['Back']);
  back.addEventListener('click', ()=>{ if(ctx.onBack) ctx.onBack(); });
  wrapper.appendChild(back);
  container.appendChild(el('h1',{},['Daggerford']));
  container.appendChild(el('div',{class:'ip-display'},[
    'IP: ',
    el('span',{class:'ip-value'},[(ctx.meta && typeof ctx.meta.ip !== 'undefined' ? ctx.meta.ip : 0)])
  ]));

  // Recruit Heroes (by tier)
  const recruit = section('Recruit Heroes');
  [1,2,3,4].forEach(t=>{
    const tierWrap = el('div',{class:'tier-section tier-'+t},[]);
    tierWrap.appendChild(el('h3',{class:'section-title'},[tierName(t)]));
    const grid = el('div',{class:'card-grid'},[]);
    (ctx.data.cards||[]).filter(c=>Number(c.tier)===t).forEach(c=>{
      const cardWrap = el('div',{class:'card-wrap panel'},[]);
      const footer = el('div',{class:'row'},[]);
      const owned = (ctx.meta && Array.isArray(ctx.meta.ownedCards) && ctx.meta.ownedCards.includes(c.id));
      const cost = Number(c.ip_cost||0);
      const btn = el('button',{class:'btn','data-card':String(c.id)},[ owned? 'Recruited' : (cost>0? ('Recruit: '+cost+' IP') : 'Take') ]);
      if(owned) btn.setAttribute('disabled','');
      if(!owned && cost>0 && ctx.meta && ctx.meta.ip < cost) btn.setAttribute('disabled','');
      btn.addEventListener('click',()=>{
        if(!ctx.buyLegendary){ if(ctx.setMessage) ctx.setMessage('No buy handler'); return; }
        const res = ctx.buyLegendary(c.id);
        if(res && res.success){ try{ const ipSpan = document.querySelector('.ip-value'); if(ipSpan) ipSpan.textContent = String((ctx.meta && typeof ctx.meta.ip !== 'undefined') ? ctx.meta.ip : 0); }catch(e){} try{ refreshAllShop(); }catch(e){} }
      });
      footer.appendChild(btn);
      const opts = { hideSlot:false, hideCost:true, footer };
      const tile = cardTile(c, opts);
      try{ tile.style.height = '470px'; tile.style.minHeight = '470px'; tile.style.maxHeight = '470px'; }catch(e){}
      cardWrap.appendChild(tile);
      grid.appendChild(cardWrap);
    });
    tierWrap.appendChild(grid);
    recruit.appendChild(tierWrap);
  });
  container.appendChild(recruit);

  // Hire Summons
  const summonsSec = section('Hire Summons');
  const sGrid = el('div',{class:'card-grid summons-grid'},[]);
  (ctx.data.summons||[]).forEach(s=>{
    if(s && s.adventure_only && !(ctx && ctx.isAdventure)) return;
    const owned = (ctx.meta && Array.isArray(ctx.meta.ownedSummons) && ctx.meta.ownedSummons.includes(s.id));
    const hasEarnedIp = ctx.meta && ((ctx.meta.totalIpEarned||0) > 0);
    // only show this summon in the shop if it's a starter, already owned, or the player has earned IP (Town unlocked)
    if(!owned && !s.starter && !hasEarnedIp) return;
    const wrap = el('div',{class:'card-wrap panel'},[]);
    const footer = el('div',{class:'row'},[]);
    const cost = Number(s.ip_cost||0);
    const btn = el('button',{class:'btn','data-summon':String(s.id)},[ owned? 'Recruited' : ('Recruit: '+cost+' IP') ]);
    if(owned) btn.setAttribute('disabled','');
    if(!owned && ctx.meta && ctx.meta.ip < cost) btn.setAttribute('disabled','');
    btn.addEventListener('click',()=>{
      if(!ctx.buyLegendary){ if(ctx.setMessage) ctx.setMessage('No buy handler'); return; }
      const res = ctx.buyLegendary(s.id);
      if(res && res.success){ try{ const ipSpan = document.querySelector('.ip-value'); if(ipSpan) ipSpan.textContent = String((ctx.meta && typeof ctx.meta.ip !== 'undefined') ? ctx.meta.ip : 0); }catch(e){} try{ refreshAllShop(); }catch(e){} }
    });
    footer.appendChild(btn);
    const sOpts = { hideSlot:true, hideCost:true, footer };
    const sTile = cardTile(s, sOpts);
    try{ sTile.style.height = '450px'; sTile.style.minHeight = '450px'; sTile.style.maxHeight = '450px'; }catch(e){}
    wrap.appendChild(sTile);
    sGrid.appendChild(wrap);
  });
  summonsSec.appendChild(sGrid);
  container.appendChild(summonsSec);

  // Metagame upgrades
  const metaSec = section('Metagame');
  const upGrid = el('div',{class:'card-grid meta-grid'},[]);
  // Helper to refresh all meta upgrade buttons (used after purchases)
  function refreshMetaButtons(){
    try{
      (ctx.data.upgrades||[]).forEach(u=>{
        try{
          const btn = document.querySelector('[data-upgrade="'+String(u.id)+'"]');
          if(!btn) return;
          const purchased = ctx.meta && Array.isArray(ctx.meta.purchasedUpgrades) && ctx.meta.purchasedUpgrades.includes(u.id);
          const purchasedList = (ctx.meta && Array.isArray(ctx.meta.purchasedUpgrades)) ? ctx.meta.purchasedUpgrades : [];
          let prereqLocked = false;
          if(/^slot_(\d+)$/.test(u.id)){
            const m = /^slot_(\d+)$/.exec(u.id);
            const n = Number(m && m[1]);
            if(n > 1 && !purchasedList.includes('slot_'+(n-1))) { prereqLocked = true; }
          } else if(u.id === 'ap_5' && !purchasedList.includes('ap_4')){
            prereqLocked = true;
          } else if(u.id === 'formation_3' && !purchasedList.includes('formation_2')){
            prereqLocked = true;
          } else if(u.id === 'slot_plus3' && !purchasedList.includes('slot_9')){
            prereqLocked = true;
          }
          const cost = Number(u.ip_cost||0);
          const affordable = ctx.meta && (ctx.meta.ip >= cost);
          let label;
          if(purchased) label = 'Purchased';
          else if(prereqLocked) label = 'Requires previous purchase';
          else label = 'Buy: ' + cost + ' IP';
          try{ btn.textContent = label; }catch(e){}
          if(purchased || prereqLocked) btn.setAttribute('disabled','');
          else if(!affordable) btn.setAttribute('disabled','');
          else btn.removeAttribute('disabled');
        }catch(e){}
      });
    }catch(e){}
  }
  // Refresh recruit buttons (cards)
  function refreshRecruitButtons(){
    try{
      (ctx.data.cards||[]).forEach(c=>{
        try{
          const btn = document.querySelector('[data-card="'+String(c.id)+'"]');
          if(!btn) return;
          const owned = (ctx.meta && Array.isArray(ctx.meta.ownedCards) && ctx.meta.ownedCards.includes(c.id));
          const cost = Number(c.ip_cost||0);
          try{ btn.textContent = owned ? 'Recruited' : (cost>0? ('Recruit: '+cost+' IP') : 'Take'); }catch(e){}
          if(owned) btn.setAttribute('disabled','');
          else if(!owned && cost>0 && ctx.meta && ctx.meta.ip < cost) btn.setAttribute('disabled','');
          else btn.removeAttribute('disabled');
        }catch(e){}
      });
    }catch(e){}
  }
  // Refresh summon buttons
  function refreshSummonButtons(){
    try{
      (ctx.data.summons||[]).forEach(s=>{
        try{
          const btn = document.querySelector('[data-summon="'+String(s.id)+'"]');
          if(!btn) return;
          const owned = (ctx.meta && Array.isArray(ctx.meta.ownedSummons) && ctx.meta.ownedSummons.includes(s.id));
          const cost = Number(s.ip_cost||0);
          try{ btn.textContent = owned ? 'Recruited' : ('Recruit: '+cost+' IP'); }catch(e){}
          if(owned) btn.setAttribute('disabled','');
          else if(!owned && ctx.meta && ctx.meta.ip < cost) btn.setAttribute('disabled','');
          else btn.removeAttribute('disabled');
        }catch(e){}
      });
    }catch(e){}
  }
  // Refresh or render legendary section if legendaryUnlocked changed
  function refreshLegendarySection(){
    try{
      const hasSection = !!document.querySelector('.legendary-grid');
      if(ctx.meta && ctx.meta.legendaryUnlocked){
        if(!hasSection){
          // Build and append the legendary section in-place
          try{
            const legSec = section('Legendary Store');
            const lGrid = el('div',{class:'card-grid legendary-grid'},[]);
            (ctx.data.legendary||[]).forEach(it=>{
              const elCard = el('div',{class:'card-wrap panel'},[]);
              const footer = el('div',{class:'row'},[]);
              const isCard = typeof it.hp === 'number';
              const owned = isCard ? (ctx.meta && Array.isArray(ctx.meta.ownedCards) && ctx.meta.ownedCards.includes(it.id)) : (ctx.meta && Array.isArray(ctx.meta.ownedSummons) && ctx.meta.ownedSummons.includes(it.id));
              const cost = Number(it.ip_cost||0);
              const buy = el('button',{class:'btn','data-legendary':String(it.id)},[ owned ? 'Purchased' : ('Recruit: '+cost+' IP') ]);
              if(owned) buy.setAttribute('disabled','');
              else if(ctx.meta && ctx.meta.ip < cost) buy.setAttribute('disabled','');
              buy.addEventListener('click',()=>{
                if(!ctx.buyLegendary){ if(ctx.setMessage) ctx.setMessage('No buy handler'); return; }
                const res = ctx.buyLegendary(it.id);
                if(res && res.success){ try{ const ipSpan = document.querySelector('.ip-value'); if(ipSpan) ipSpan.textContent = String((ctx.meta && typeof ctx.meta.ip !== 'undefined') ? ctx.meta.ip : 0); }catch(e){} try{ refreshAllShop(); }catch(e){} }
              });
              footer.appendChild(buy);
              const lOpts = { hideSlot: !isCard, hideCost: true, footer };
              try{ if(it && it.id === 'griff') lOpts.imageOverride = './assets/griff1.png'; }catch(e){}
              try{ if(it && it.id === 'blackrazor') lOpts.imageOverride = './assets/blackrazor.png'; }catch(e){}
              const lTile = cardTile(it, lOpts);
              try{ lTile.style.height = '470px'; lTile.style.minHeight = '470px'; lTile.style.maxHeight = '470px'; }catch(e){}
              if(it && it.id === 'blackrazor'){ try{ elCard.classList.add('blackrazor'); }catch(e){} }
              elCard.appendChild(lTile);
              lGrid.appendChild(elCard);
            });
            legSec.appendChild(lGrid);
            container.appendChild(legSec);
            return;
          }catch(e){}
        } else {
          // update buttons inside existing legendary grid
          (ctx.data.legendary||[]).forEach(it=>{
            try{
              const btn = document.querySelector('[data-legendary="'+String(it.id)+'"]');
              if(!btn) return;
              const isCard = typeof it.hp === 'number';
              const owned = isCard ? (ctx.meta && Array.isArray(ctx.meta.ownedCards) && ctx.meta.ownedCards.includes(it.id)) : (ctx.meta && Array.isArray(ctx.meta.ownedSummons) && ctx.meta.ownedSummons.includes(it.id));
              const cost = Number(it.ip_cost||0);
              try{ btn.textContent = owned ? 'Purchased' : ('Recruit: '+cost+' IP'); }catch(e){}
              if(owned) btn.setAttribute('disabled','');
              else if(ctx.meta && ctx.meta.ip < cost) btn.setAttribute('disabled','');
              else btn.removeAttribute('disabled');
            }catch(e){}
          });
        }
      } else {
        if(hasSection){
          // remove legendary section if present
          try{ const sec = document.querySelector('.legendary-grid'); if(sec) sec.parentNode && sec.parentNode.parentNode && sec.parentNode.parentNode.removeChild(sec.parentNode); }catch(e){}
        }
      }
    }catch(e){}
  }
  function refreshAllShop(){
    try{ refreshMetaButtons(); }catch(e){}
    try{ refreshRecruitButtons(); }catch(e){}
    try{ refreshSummonButtons(); }catch(e){}
    try{ refreshLegendarySection(); }catch(e){}
  }
  (ctx.data.upgrades||[]).forEach(u=>{
    const item = el('div',{class:'panel card'},[]);
    item.appendChild(el('div',{class:'card-name'},[u.upgrade||u.id]));
    const purchased = ctx.meta && Array.isArray(ctx.meta.purchasedUpgrades) && ctx.meta.purchasedUpgrades.includes(u.id);
    // determine if this upgrade is locked behind another purchase
    let prereqLocked = false;
    let prereqMessage = '';
    const purchasedList = (ctx.meta && Array.isArray(ctx.meta.purchasedUpgrades)) ? ctx.meta.purchasedUpgrades : [];
    const slotMatch = /^slot_(\d+)$/.exec(u.id);
    if(slotMatch){
      const n = Number(slotMatch[1]);
      if(n > 1 && !purchasedList.includes('slot_'+(n-1))){ prereqLocked = true; prereqMessage = 'Requires previous slot'; }
    } else if(u.id === 'ap_5' && !purchasedList.includes('ap_4')){
      prereqLocked = true; prereqMessage = 'Requires AP to 4';
    } else if(u.id === 'formation_3' && !purchasedList.includes('formation_2')){
      // Formation 3 requires Formation 2 to be purchased first
      prereqLocked = true; prereqMessage = 'Requires Formation 2';
    } else if(u.id === 'slot_plus3' && !purchasedList.includes('slot_9')){
      prereqLocked = true; prereqMessage = 'Requires all previous slot upgrades';
    }
    const cost = Number(u.ip_cost||0);
    const affordable = ctx.meta && (ctx.meta.ip >= cost);
    let label;
    if(purchased) label = 'Purchased';
    else if(prereqLocked) label = (prereqMessage || 'Requires previous purchase');
    else label = 'Buy: ' + cost + ' IP';
    const b = el('button',{class:'btn','data-upgrade':String(u.id)},[ label ]);
    if(purchased || prereqLocked) b.setAttribute('disabled','');
    else if(!affordable) b.setAttribute('disabled','');
    b.addEventListener('click',()=>{
      if(!ctx.buyUpgrade){ if(ctx.setMessage) ctx.setMessage('No buy handler'); return; }
      const res = ctx.buyUpgrade(u.id);
      if(res && res.success){
        try{ const ipSpan = document.querySelector('.ip-value'); if(ipSpan) ipSpan.textContent = String((ctx.meta && typeof ctx.meta.ip !== 'undefined') ? ctx.meta.ip : 0); }catch(e){}
        // Some upgrades unlock others; refresh all shop sections to reflect new state
        try{ refreshAllShop(); }catch(e){}
      }
    });
    item.appendChild(b);
    upGrid.appendChild(item);
  });
  metaSec.appendChild(upGrid);
  container.appendChild(metaSec);

  // Legendary Store (hidden unless unlocked)
  if(ctx.meta && ctx.meta.legendaryUnlocked){
    const legSec = section('Legendary Store');
    const lGrid = el('div',{class:'card-grid legendary-grid'},[]);
    (ctx.data.legendary||[]).forEach(it=>{
      const elCard = el('div',{class:'card-wrap panel'},[]);
      // cost and purchase button
      const footer = el('div',{class:'row'},[]);
      // determine if this legendary is a hero/card (has hp or explicit kind)
      const isCard = typeof it.hp === 'number';
      const owned = isCard ? (ctx.meta && Array.isArray(ctx.meta.ownedCards) && ctx.meta.ownedCards.includes(it.id)) : (ctx.meta && Array.isArray(ctx.meta.ownedSummons) && ctx.meta.ownedSummons.includes(it.id));
      const cost = Number(it.ip_cost||0);
      const buy = el('button',{class:'btn','data-legendary':String(it.id)},[ owned ? 'Purchased' : ('Recruit: '+cost+' IP') ]);
      if(owned) buy.setAttribute('disabled','');
      else if(ctx.meta && ctx.meta.ip < cost) buy.setAttribute('disabled','');
      buy.addEventListener('click',()=>{
        if(!ctx.buyLegendary){ if(ctx.setMessage) ctx.setMessage('No buy handler'); return; }
        const res = ctx.buyLegendary(it.id);
        if(res && res.success){ try{ const ipSpan = document.querySelector('.ip-value'); if(ipSpan) ipSpan.textContent = String((ctx.meta && typeof ctx.meta.ip !== 'undefined') ? ctx.meta.ip : 0); }catch(e){} try{ refreshAllShop(); }catch(e){} }
      });
      footer.appendChild(buy);
      // use the shared cardTile renderer so images/icons are shown consistently
      // add a special class for Blackrazor so we can size its image differently
      if(it && it.id === 'blackrazor'){ try{ elCard.classList.add('blackrazor'); }catch(e){} }
      try{ if(it && it.id === 'blackrazor') lOpts.imageOverride = './assets/blackrazor.png'; }catch(e){}
      // Legendary store: render fixed griff1 for Griff
      const lOpts = { hideSlot: !isCard, hideCost: true, footer };
      try{ if(it && it.id === 'griff') lOpts.imageOverride = './assets/griff1.png'; }catch(e){}
      const lTile = cardTile(it, lOpts);
      try{ lTile.style.height = '470px'; lTile.style.minHeight = '470px'; lTile.style.maxHeight = '470px'; }catch(e){}
      elCard.appendChild(lTile);
      lGrid.appendChild(elCard);
    });
    legSec.appendChild(lGrid);
    container.appendChild(legSec);
  }
  wrapper.appendChild(container);
  // Add music controls
  addMusicControls(wrapper);

  root.appendChild(wrapper);
}

