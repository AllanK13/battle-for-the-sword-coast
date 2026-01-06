import { validateNavigate, advanceAdventureStep, getNextStep } from '../engine/adventure-flow.js';

const routes = {};
let currentRoot = null;
let _currentRouteName = null;
export function register(name, renderFn){ routes[name]=renderFn; }
export function navigate(name, params){
  // Validate navigation against adventure flow if in adventure mode
  if (params && params.ctx && params.ctx.isAdventure) {
    const validation = validateNavigate(params.ctx, name, {
      force: params.force || params.debug,
      debug: params.debug
    });
    
    if (!validation.allowed) {
      console.warn(`[Adventure Flow] Navigation blocked: ${validation.reason}`);
      console.warn(`[Adventure Flow] Expected: ${validation.expectedRoute}, Attempted: ${name}`);
      
      // In production, block the navigation
      // In debug mode with explicit flag, we already allowed it via validateNavigate
      if (!params.force && !params.debug) {
        console.error('[Adventure Flow] Navigation prevented. Use { debug: true } or { force: true } to override.');
        return;
      }
    }
    
    // If navigating to the next step, automatically advance the flow
    try {
      const nextStep = getNextStep(params.ctx);
      if (nextStep && (name === nextStep.id || (name === 'battle' && nextStep.type === 'battle'))) {
        advanceAdventureStep(params.ctx);
      }
    } catch (e) {
      console.error('[Adventure Flow] Error auto-advancing:', e);
    }
  }
  
  const root = document.getElementById('app');
  root.innerHTML='';
  currentRoot = root;
  // Scroll to top only when navigating to a different route name, or when explicitly forced
  const force = params && (params.forceScroll === true || params.scrollToTop === true);
  if(force || name !== _currentRouteName){
    try{
      if(typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }catch(e){}
    try{ root.scrollTop = 0; document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }catch(e){}
  }
  _currentRouteName = name;
  const fn = routes[name];
  if(!fn) { root.textContent = 'Route not found: '+name; return }
  fn(root, params);
}
