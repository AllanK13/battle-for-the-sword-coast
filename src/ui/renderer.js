export function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{ if(k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v); else e.setAttribute(k,v); });
  if(typeof children === 'string') e.textContent = children;
  else children.forEach(c=>{
    if(c === null || typeof c === 'undefined') return;
    if(typeof c === 'string' || typeof c === 'number' || typeof c === 'boolean') e.appendChild(document.createTextNode(String(c)));
    else e.appendChild(c);
  });
  return e;
}

export function cardTile(item, opts={}){
  // Show image asset (assets/<name>.png or .jpg) and stats underneath
  const d = el('div',{class:'card panel'});
  // build candidate base names (prefer id, then various name transformations)
  const bases = [];
  if(item.id) bases.push(item.id);
  if(item.name) bases.push(item.name);
  if(item.name) bases.push(item.name.replace(/\s+/g,'_'));
  if(item.name) bases.push(item.name.replace(/\s+/g,'').toLowerCase());
  if(item.name) bases.push(item.name.replace(/\s+/g,'_').toLowerCase());
  // dedupe
  const seen = new Set();
  const candidates = bases.filter(b=>{ if(!b) return false; const k=b; if(seen.has(k)) return false; seen.add(k); return true; });
  const exts = ['png','jpg','webp'];
  let tryIndex = 0;
  const img = el('img',{alt:item.name, class:'card-image'});
  img.addEventListener('error', ()=>{
    // advance to next candidate
    tryIndex++;
    const total = candidates.length * exts.length;
    if(tryIndex >= total){ img.style.display='none'; return; }
    const ci = Math.floor(tryIndex / exts.length);
    const ei = tryIndex % exts.length;
    img.src = 'assets/'+encodeURIComponent(candidates[ci])+'.'+exts[ei];
  });
  // start with first candidate
  if(candidates.length>0){ img.src = 'assets/'+encodeURIComponent(candidates[0])+'.png'; } else { img.style.display='none'; }
  d.appendChild(img);
  // insert a name label above the image if present (shows character/summon/enemy names)
  if(item.name){
    const nameEl = el('div',{class:'card-name'},[item.name]);
    d.insertBefore(nameEl, img);
  }
  // stats / body container (allows wrapping and consistent card size)
  const stats = el('div',{class:'card-body'},[]);
  const hpToShow = (typeof opts.currentHp !== 'undefined') ? opts.currentHp : item.hp;
  // allow callers to request slot shown before HP
  if(opts.slotFirst){
    if(typeof item.slot_cost !== 'undefined' && !opts.hideSlot) stats.appendChild(el('div',{class:'muted card-stat'},['Party Slots: '+item.slot_cost]));
    if(typeof hpToShow !== 'undefined' && !opts.hideHp) stats.appendChild(el('div',{class:'muted card-stat'},['HP: '+hpToShow]));
  } else {
    if(typeof hpToShow !== 'undefined' && !opts.hideHp) stats.appendChild(el('div',{class:'muted card-stat'},['HP: '+hpToShow]));
    if(typeof item.slot_cost !== 'undefined' && !opts.hideSlot) stats.appendChild(el('div',{class:'muted card-stat'},['Party Slots: '+item.slot_cost]));
  }
  if(!opts.hideCost && typeof item.ip_cost !== 'undefined') stats.appendChild(el('div',{class:'muted card-stat'},['Cost: '+item.ip_cost]));
  if(item.ability) stats.appendChild(el('div',{class:'muted card-desc'},[item.ability]));
  d.appendChild(stats);
  // if caller provided a footer element, append it inside the card so it stays anchored
  if(opts.footer){
    try{ opts.footer.classList.add('card-footer'); }catch(e){}
    d.appendChild(opts.footer);
  }
  // show temp HP badge (top-left) only when temp HP is a positive number
  if(typeof opts.tempHp !== 'undefined' && Number(opts.tempHp) > 0){
    try{ d.style.position = d.style.position || 'relative'; }catch(e){}
    const t = el('div',{class:'card-temp-hp'},[ String(opts.tempHp) ]);
    d.appendChild(t);
  }
  return d;
}
