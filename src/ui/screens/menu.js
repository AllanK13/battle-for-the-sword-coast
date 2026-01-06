import { el } from '../renderer.js';
import { initMusic } from '../../engine/helpers.js';
import { AudioManager } from '../../engine/audio.js';
import { addMusicControls } from '../music-controls.js';

export function renderMenu(root, ctx={}){
  const container = el('div',{class:'menu-screen'},[]);
  const titleText = (ctx && ctx.meta && ctx.meta.gameName) ? ctx.meta.gameName : 'Battle for the Sword Coast';
  const titleEl = el('h1',{class:'game-title'},[ titleText ]);
  container.appendChild(titleEl);
  const logo = el('img',{src:'assets/title_logo.png', alt:titleText, class:'menu-logo'});
  logo.addEventListener('error', ()=>{ logo.src='assets/title_logo.jpg'; });
  logo.addEventListener('error', ()=>{ logo.style.display='none'; });
  container.appendChild(logo);

  const btnWrap = el('div',{class:'menu-buttons'},[]);
  function createBtn(label, onClick, disabled){
    const attrs = { class: 'btn menu-button', type: 'button' };
    if(disabled){ attrs.class += ' disabled'; attrs['aria-disabled'] = 'true'; attrs.disabled = 'true'; }
    const b = el('button', attrs, [ label ]);
    if(!disabled && typeof onClick === 'function') b.addEventListener('click', onClick);
    else if(disabled){
      // show a small badge and optionally notify host when locked buttons are attempted
      const badge = el('div',{class:'coming-soon-badge'},['Coming Soon']);
      b.appendChild(badge);
      b.addEventListener('click', ()=>{ if(typeof ctx.onAttemptLocked === 'function') ctx.onAttemptLocked(label); });
    }
    return b;
  }

  const arcadeBtn = createBtn('Arcade Mode', ()=>{ if(typeof ctx.onArcade === 'function') ctx.onArcade(); }, false);
  // mark arcade button for specialized styling and add a small icon
  try{ arcadeBtn.classList.add('arcade'); const icon = el('span',{class:'menu-btn-icon-left'},['🎮']); arcadeBtn.insertBefore(icon, arcadeBtn.firstChild); }catch(e){}
  const adventureBtn = createBtn('Adventure Mode', ()=>{ if(typeof ctx.onAdventure === 'function') ctx.onAdventure(); }, false);
  try{ adventureBtn.classList.add('adventure'); const aicon = el('span',{class:'menu-btn-icon-left'},['🗺️']); adventureBtn.insertBefore(aicon, adventureBtn.firstChild); }catch(e){}
  const campaignBtn = createBtn('Campaign Mode', null, true);
  try{ campaignBtn.classList.add('campaign'); const cicon = el('span',{class:'menu-btn-icon-left'},['🏰']); campaignBtn.insertBefore(cicon, campaignBtn.firstChild); }catch(e){}

  // layout: Arcade first, then the locked modes
  btnWrap.appendChild(arcadeBtn);
  btnWrap.appendChild(adventureBtn);
  btnWrap.appendChild(campaignBtn);
  container.appendChild(btnWrap);

  // Start menu music and add music controls
  try{ initMusic('menu.mp3', { autoplay: true, loop: true }); try{ AudioManager && AudioManager.play && AudioManager.play(); }catch(e){} }catch(e){}
  addMusicControls(container);

  root.appendChild(container);
}
