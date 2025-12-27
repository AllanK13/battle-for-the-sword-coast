export function splitNarrative(text, delimiter='|'){
  if(!text) return [];
  const t = String(text);
  if(t.indexOf(delimiter) !== -1){
    return t.split(delimiter).map(s => s.replace(/\r?\n/g,' ').trim()).filter(Boolean);
  }
  // fallback: split into sentences similar to previous logic
  return (t.match(/[^\.\!\?…]+[\.\!\?…]*/g) || []).map(s => s.trim()).filter(Boolean);
}
