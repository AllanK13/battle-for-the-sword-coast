// Helper to attach left-click advancement for cinematic dialogue paragraphs
export function attachCinematicAdvance(container, pEls, opts = {}){
  if(!container || !Array.isArray(pEls)) return { revealNext: ()=>{}, detach: ()=>{} };
  let index = 0;
  const onComplete = (typeof opts.onComplete === 'function') ? opts.onComplete : null;
  function revealNext(){
    try{
      if(index < pEls.length){
        const p = pEls[index++];
        try{ p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }catch(e){}
        if(index === pEls.length && onComplete) try{ onComplete(); }catch(e){}
      }
    }catch(e){}
  }
  const handler = (ev)=>{ try{ if(ev && ev.button === 0){ ev.preventDefault(); revealNext(); } }catch(e){} };
  try{ container.addEventListener('click', handler); }catch(e){}
  return { revealNext, detach: ()=>{ try{ container.removeEventListener('click', handler); }catch(e){} } };
}
