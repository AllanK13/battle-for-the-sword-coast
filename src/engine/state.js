let current = null;
const subs = new Set();

export function startRun({seed, deckCardIds, data, meta}){
  current = { seed, deckCardIds, data, meta, runs: [] };
  subs.forEach(s=>s(current));
  return current;
}

export function getState(){ return current; }

export function updateState(patch){ current = Object.assign({}, current, patch); subs.forEach(s=>s(current)); return current; }

export function subscribe(fn){ subs.add(fn); return ()=>subs.delete(fn); }

export function endRun(summary){ if(!current) return; current.runs.push(summary); subs.forEach(s=>s(current)); }
