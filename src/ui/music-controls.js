import { el } from './renderer.js';
import { AudioManager } from '../engine/audio.js';

/**
 * Creates floating music control button with volume panel.
 * Appends both the button and panel to the provided root element.
 * @param {HTMLElement} root - The root element to append controls to
 */
export function addMusicControls(root){
  try{
    const musicBtn = el('button',{class:'btn music-btn floating icon', style:'position:fixed;right:18px;bottom:36px;z-index:10030;height:40px;display:flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:6px;background:linear-gradient(180deg,#10b981,#047857);color:#fff;border:1px solid rgba(0,0,0,0.12);font-size:22px', title:'Music'},[ el('span',{style:'font-size:22px;line-height:1;display:inline-block'},[ AudioManager.isEnabled() ? '🔊' : '🔈' ]) ]);
    const musicPanel = el('div',{class:'panel music-panel', style:'position:fixed;right:18px;bottom:76px;z-index:10030;display:none;padding:8px;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,0.25)'},[]);
    const volLabel = el('div',{},['Volume']);
    const volInput = el('input',{type:'range', min:0, max:100, value: String(Math.round((AudioManager.getVolume ? AudioManager.getVolume() : 0.6) * 100)), style:'width:160px;display:block'});
    volInput.addEventListener('input', (ev)=>{ const v = Number(ev.target.value || 0) / 100; AudioManager.setVolume(v); });
    // Keep controls in sync with AudioManager state
    function syncControls(){
      try{
        const span = musicBtn.querySelector('span');
        if(span) span.textContent = AudioManager.isEnabled() ? '🔊' : '🔈';
        const v = Math.round((AudioManager.getVolume ? AudioManager.getVolume() : 0.6) * 100);
        volInput.value = String(v);
      }catch(e){ /* ignore */ }
    }
    musicPanel.appendChild(volLabel);
    musicPanel.appendChild(volInput);

    let panelTimer = null;
    function showPanel(){
      syncControls();
      musicPanel.style.display = 'block';
      if(panelTimer) clearTimeout(panelTimer);
      panelTimer = setTimeout(()=>{ musicPanel.style.display = 'none'; panelTimer = null; }, 4000);
    }

    musicBtn.addEventListener('click', ()=>{
      const on = AudioManager.toggle();
      // update inner span
      const span = musicBtn.querySelector('span'); if(span) span.textContent = on ? '🔊' : '🔈';
      syncControls();
      showPanel();
    });

    musicBtn.addEventListener('mouseover', showPanel);
    musicPanel.addEventListener('mouseover', ()=>{ if(panelTimer) clearTimeout(panelTimer); });
    musicPanel.addEventListener('mouseleave', ()=>{ if(panelTimer) clearTimeout(panelTimer); panelTimer = setTimeout(()=>{ musicPanel.style.display='none'; panelTimer=null; }, 1000); });

    root.appendChild(musicBtn);
    root.appendChild(musicPanel);
  }catch(e){ /* ignore if AudioManager unavailable */ }
}
