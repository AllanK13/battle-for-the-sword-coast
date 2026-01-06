// Adventure Flow Engine
// Manages linear adventure progression and validates navigation against the flow.
// Prevents out-of-order navigation caused by background session callbacks.

import { daggerfordMeta } from '../data/adventures/daggerford_flow.js';

// Registry of all adventures
const ADVENTURES = {
  'daggerford': daggerfordMeta
};

/**
 * Load the flow definition for a given adventure
 * @param {string} adventureId - The adventure identifier (e.g., 'daggerford')
 * @returns {Array} Array of flow steps or empty array if not found
 */
export function loadAdventureFlow(adventureId) {
  const adventure = ADVENTURES[adventureId];
  return adventure ? adventure.flow : [];
}

/**
 * Get the current step in the adventure flow
 * @param {Object} ctx - The game context object
 * @returns {Object|null} Current step object or null if no active adventure
 */
export function getCurrentStep(ctx) {
  if (!ctx || !ctx.isAdventure || !ctx.meta) return null;
  
  // Initialize progress if missing (back-compat for existing saves)
  if (!ctx.meta.adventureProgress) {
    ctx.meta.adventureProgress = { adventureId: 'daggerford', index: 0 };
  }
  
  const progress = ctx.meta.adventureProgress;
  const flow = loadAdventureFlow(progress.adventureId);
  
  if (!flow || flow.length === 0) return null;
  if (progress.index < 0 || progress.index >= flow.length) return null;
  
  return flow[progress.index];
}

/**
 * Get the next step in the adventure flow
 * @param {Object} ctx - The game context object
 * @returns {Object|null} Next step object or null if at end or no active adventure
 */
export function getNextStep(ctx) {
  if (!ctx || !ctx.isAdventure || !ctx.meta) return null;
  
  const progress = ctx.meta.adventureProgress;
  if (!progress) return null;
  
  const flow = loadAdventureFlow(progress.adventureId);
  const nextIndex = progress.index + 1;
  
  if (nextIndex >= flow.length) return null;
  
  return flow[nextIndex];
}

/**
 * Advance to the next step in the adventure
 * @param {Object} ctx - The game context object
 * @param {Object} opts - Options { save: boolean }
 * @returns {Object|null} The new current step after advancing, or null if at end
 */
export function advanceAdventureStep(ctx, opts = {}) {
  if (!ctx || !ctx.isAdventure || !ctx.meta) return null;
  
  // Initialize progress if missing
  if (!ctx.meta.adventureProgress) {
    ctx.meta.adventureProgress = { adventureId: 'daggerford', index: 0 };
  }
  
  const progress = ctx.meta.adventureProgress;
  const flow = loadAdventureFlow(progress.adventureId);
  
  if (!flow || flow.length === 0) return null;
  
  // Advance index
  progress.index += 1;
  
  // If we've reached the end, return null
  if (progress.index >= flow.length) {
    progress.index = flow.length - 1; // clamp to last step
    return null;
  }
  
  // Auto-save progress if requested (default: true)
  if (opts.save !== false) {
    try {
      // Dynamic import is handled synchronously in browser context
      import('./meta.js').then(module => {
        module.saveMetaIfAllowed(ctx.meta, ctx);
      }).catch(e => {
        // ignore save errors
      });
    } catch (e) {
      // ignore save errors
    }
  }
  
  return flow[progress.index];
}

/**
 * Validate if a navigation target is allowed according to the flow
 * @param {Object} ctx - The game context object
 * @param {string} targetRoute - The route being navigated to
 * @param {Object} opts - Options { force: boolean, debug: boolean }
 * @returns {Object} { allowed: boolean, reason: string, expectedRoute: string }
 */
export function validateNavigate(ctx, targetRoute, opts = {}) {
  // Allow all navigation if not in an adventure
  if (!ctx || !ctx.isAdventure) {
    return { allowed: true, reason: 'Not in adventure mode' };
  }
  
  // Allow if force/debug flag is set
  if (opts.force || opts.debug) {
    return { allowed: true, reason: 'Debug/force override enabled' };
  }
  
  // Allow if no meta (initialization race)
  if (!ctx.meta) {
    return { allowed: true, reason: 'No meta yet (initialization)' };
  }
  
  const currentStep = getCurrentStep(ctx);
  
  // Allow if we can't determine current step (defensive)
  if (!currentStep) {
    return { allowed: true, reason: 'Cannot determine current step' };
  }
  
  // Special case: 'battle' route matches current step if it's a battle type
  if (targetRoute === 'battle' && currentStep.type === 'battle') {
    return { allowed: true, reason: 'Battle step matches flow' };
  }
  
  // Check if target matches current step
  if (targetRoute === currentStep.id) {
    return { allowed: true, reason: 'Matches current step' };
  }
  
  // Get next step and check if target matches
  const nextStep = getNextStep(ctx);
  if (nextStep && targetRoute === nextStep.id) {
    return { allowed: true, reason: 'Matches next step (auto-advance will occur)' };
  }
  
  // Special case: allow 'battle' if next step is a battle
  if (targetRoute === 'battle' && nextStep && nextStep.type === 'battle') {
    return { allowed: true, reason: 'Next step is battle' };
  }
  
  // Navigation not allowed
  return {
    allowed: false,
    reason: `Out of sequence: expected ${currentStep.id}, got ${targetRoute}`,
    expectedRoute: currentStep.id,
    currentStep
  };
}

/**
 * Navigate to the next step in the adventure flow
 * @param {Object} ctx - The game context object
 * @param {Function} navigateFn - The navigate function from router
 * @returns {boolean} True if navigation occurred, false otherwise
 */
export function navigateToNextStep(ctx, navigateFn) {
  if (!ctx || !ctx.isAdventure) return false;
  
  const nextStep = advanceAdventureStep(ctx);
  
  if (!nextStep) {
    console.warn('Adventure flow: no next step available');
    return false;
  }
  
  // Navigate to the next step
  try {
    if (nextStep.type === 'battle') {
      navigateFn('battle', ctx);
    } else {
      navigateFn(nextStep.id, ctx);
    }
    return true;
  } catch (e) {
    console.error('Adventure flow: navigation failed', e);
    return false;
  }
}

/**
 * Reset adventure progress (for testing or restart)
 * @param {Object} ctx - The game context object
 */
export function resetAdventureProgress(ctx) {
  if (!ctx || !ctx.meta) return;
  ctx.meta.adventureProgress = { adventureId: 'daggerford', index: 0 };
}

/**
 * Check if a specific enemy should trigger a special flow step after defeat
 * @param {Object} ctx - The game context object
 * @param {string} enemyKey - The enemy identifier (e.g., 'thug', 'red_wizard')
 * @returns {Object|null} The next step if it's a special transition, or null
 */
export function getPostBattleStep(ctx, enemyKey) {
  if (!ctx || !ctx.isAdventure) return null;
  
  const nextStep = getNextStep(ctx);
  
  // If next step is a choice, scene, shop, or victory, return it
  if (nextStep && (nextStep.type === 'choice' || nextStep.type === 'scene' || nextStep.type === 'shop' || nextStep.type === 'victory')) {
    return nextStep;
  }
  
  return null;
}
