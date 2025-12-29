import { el } from '../renderer.js';
import { navigate } from '../router.js';
import { loadMeta } from '../../engine/meta.js';
import { addMusicControls } from '../music-controls.js';
import { splitNarrative } from './adventures/text_split.js';

export function renderAdventureStart(root, ctx = {}){
	const container = el('div',{class:'adventure-start-screen'},[]);

	const titleText = (ctx && ctx.meta && ctx.meta.gameName) ? ctx.meta.gameName : 'Battle for the Sword Coast';
	const logo = el('img',{src:'assets/title_logo.png', alt:titleText, class:'title-logo'});
	logo.addEventListener('error', ()=>{ logo.src='assets/title_logo.jpg'; });
	logo.addEventListener('error', ()=>{ logo.style.display='none'; });
	container.appendChild(logo);

	// Menu button (top-left)
	try{
		const menuBtn = el('button',{class:'btn menu-top-btn floating icon', style:'position:fixed;left:18px;top:18px;z-index:10030;height:40px;display:flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:6px;font-size:16px', title:'Menu'},[ el('span',{style:'font-size:20px;line-height:1;display:inline-block'},['🏠']) ]);
		menuBtn.addEventListener('click', ()=>{ if(ctx && typeof ctx.onBack === 'function') ctx.onBack(); else navigate('menu'); });
		container.appendChild(menuBtn);
	}catch(e){ }

	// Add music controls
	addMusicControls(container);

	// Adventure choice buttons with image placeholders above each (stacked vertically)
	const choicesWrap = el('div',{class:'adventure-choices', style:'display:flex;flex-direction:column;gap:18px;align-items:center;margin-top:18px;'},[]);
	const choices = [
		{ id:'daggerford', label:'Streets of Daggerford', img:'assets/adventure/daggerford.png' },
		{ id:'waterdeep', label:'Waterdeep Ruins', img:'assets/adventure/waterdeep.png' },
		{ id:'phandalin', label:'Saving Phandalin', img:'assets/adventure/phandalin.png' }
	];
	choices.forEach(ch => {
		const col = el('div',{class:'adventure-col', style:'width:520px;display:flex;flex-direction:column;align-items:center;'},[]);
		const img = el('img',{src:ch.img, alt:ch.label, class:'adventure-thumb', style:'width:480px;height:240px;object-fit:cover;border-radius:10px;border:1px solid rgba(0,0,0,0.08);box-shadow:0 8px 20px rgba(0,0,0,0.12);transition:transform 180ms ease, box-shadow 180ms ease'});
		img.addEventListener('error', ()=>{ img.style.background='#222'; img.style.display='block'; img.style.minHeight='240px'; img.src=''; });
		// Do not scale images on hover — keep thumbnails static for accessibility
		// (previously: mouseover/mouseout set transform/boxShadow)
		col.appendChild(img);
		const btn = el('button',{class:'btn adventure-btn', style:'margin-top:12px;width:480px;padding:12px 16px;font-size:18px;font-weight:700;border-radius:10px;background:linear-gradient(180deg,#2563eb,#1e40af);color:#fff;border:none;box-shadow:0 6px 16px rgba(16,24,40,0.2);transition:transform 120ms ease, box-shadow 120ms ease'},[ ch.label ]);
		btn.addEventListener('mouseover', ()=>{ try{ btn.style.transform='translateY(-3px)'; btn.style.boxShadow='0 12px 24px rgba(16,24,40,0.25)'; }catch(e){} });
		btn.addEventListener('mouseout', ()=>{ try{ btn.style.transform=''; btn.style.boxShadow='0 6px 16px rgba(16,24,40,0.2)'; }catch(e){} });
		btn.addEventListener('click', ()=>{
			if(ctx && typeof ctx.onStartAdventure === 'function') ctx.onStartAdventure(ch.id);
			else navigate('menu');
		});
		col.appendChild(btn);
		choicesWrap.appendChild(col);
	});

	container.appendChild(choicesWrap);

	// Debug navigation panel (visible when debug enabled)
	try{
		// Only respect the persisted meta debug flag from `meta.js`
		const debugOn = (typeof loadMeta === 'function' && loadMeta().debugEnabled);
		if(debugOn){
			const dbg = el('div',{style:'position:fixed;left:18px;bottom:18px;z-index:10050;padding:10px;border-radius:8px;background:rgba(0,0,0,0.55);color:#fff;font-size:13px;display:flex;gap:8px;align-items:center'},[]);
			const screens = [
				['menu','Menu'],
				['adventure_start','Adventure Start'],
				['adventure_daggerford_scene_1','Daggerford Scene 1'],
				['adventure_daggerford_choice_1','Daggerford Choice 1'],
				['adventure_daggerford_choice_1_result_return','Daggerford Choice 1 Result (return)'],
				['adventure_daggerford_choice_1_result_keep','Daggerford Choice 1 Result (keep)'],
				['adventure_daggerford_scene_2','Daggerford Scene 2'],
				['adventure_daggerford_choice_2','Daggerford Choice 2'],
				['adventure_daggerford_choice_2_result_live','Daggerford Choice 2 Result (live)'],
				['adventure_daggerford_choice_2_result_kill','Daggerford Choice 2 Result (kill)'],
				['adventure_daggerford_scene_3','Daggerford Scene 3'],
				['adventure_shop','Adventure Shop'],
				['adventure_daggerford_shop','Daggerford Shop'],
				['adventure_daggerford_victory','Daggerford Victory'],
				['battle','Battle'],
				['encounter_end','Encounter End'],
				['end','End Screen']
			];
			const sel = el('select',{}, screens.map(s => el('option',{value:s[0]},[s[1]])));
			const go = el('button',{class:'btn', style:'padding:6px 8px;border-radius:6px'},['Go']);
			const ctxChk = el('label',{style:'display:inline-flex;align-items:center;gap:6px;color:#ddd;margin-left:8px' },[ el('input',{type:'checkbox'}), el('span',{},['Pass ctx']) ]);
				go.addEventListener('click', ()=>{
					const target = sel.value;
					const pass = ctxChk.querySelector('input') && ctxChk.querySelector('input').checked;
					try{
						if(target === 'daggerford_shop'){
							// always include the daggerford shop flag; include ctx when requested
							const p = pass ? { ctx: ctx || {}, shop: 'daggerford' } : { ctx: {}, shop: 'daggerford' };
							navigate('daggerford_shop', p);
						} else {
							if(pass) navigate(target, ctx || {});
							else navigate(target);
						}
					}catch(e){ try{ navigate('menu'); }catch(e){} }
				});
			dbg.appendChild(sel);
			dbg.appendChild(go);
			dbg.appendChild(ctxChk);
			container.appendChild(dbg);
		}
	}catch(e){ }
	root.appendChild(container);
}
