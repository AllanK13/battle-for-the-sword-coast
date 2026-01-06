# Adventure Flow System

## Overview

The adventure flow system enforces linear progression through adventure content by defining a canonical sequence of steps (scenes, battles, choices, etc.) and validating navigation at runtime.

## Purpose

Prevents background session callbacks and pending timeouts from auto-navigating to battle screens during cinematic scenes, ensuring players experience the full narrative in the intended order.

## Architecture

### Flow Definition Files

Each adventure has a flow definition file: `src/data/adventures/<adventure_name>_flow.js`

Example structure:
```javascript
export const adventureFlow = [
  { type: 'scene', id: 'adventure_<name>_scene_1', enemyBefore: null },
  { type: 'battle', id: 'battle', enemyKey: 'enemy_id' },
  { type: 'choice', id: 'adventure_<name>_choice_1' },
  { type: 'choice_result', id: 'adventure_<name>_choice_1_result' },
  { type: 'shop', id: 'adventure_shop' },
  { type: 'victory', id: 'adventure_<name>_victory' }
];
```

**Step Types:**
- `scene` - Narrative cinematic screen
- `battle` - Combat encounter (always uses route `'battle'`, distinguished by `enemyKey`)
- `choice` - Player decision point
- `choice_result` - Outcome of player choice
- `shop` - Shopping/preparation screen
- `victory` - Adventure completion screen

### Engine Module

`src/engine/adventure-flow.js` exports:

- **`loadAdventureFlow(adventureId)`** - Returns flow array for an adventure
- **`getCurrentStep(ctx)`** - Returns current step based on `ctx.meta.adventureProgress`
- **`getNextStep(ctx)`** - Returns the next step in sequence
- **`advanceAdventureStep(ctx, opts)`** - Increments progress index and persists to meta
- **`validateNavigate(ctx, targetRoute, opts)`** - Validates if navigation is allowed
- **`navigateToNextStep(ctx, navigateFn)`** - Advances and navigates in one call
- **`getPostBattleStep(ctx, enemyKey)`** - Returns the step after a battle (for special transitions)
- **`resetAdventureProgress(ctx)`** - Resets progress to beginning (testing/restart)

### Progress Tracking

Adventure progress is stored in `ctx.meta.adventureProgress`:
```javascript
{
  adventureId: 'daggerford',
  index: 0  // Current step index in the flow array
}
```

### Router Integration

`src/ui/router.js` calls `validateNavigate()` before every navigation when `ctx.isAdventure` is true. Navigation is blocked unless:
- Target matches current or next step in flow
- `params.force = true` or `params.debug = true` is passed (debug override)

Debug override logs are always printed for traceability.

### Cinematic Protection

All cinematic screens (scenes, choices, shop, victory) must:

1. Call `disableStateHandlers(ctx)` on mount to suppress `ctx.onStateChange` and `ctx.setMessage`
2. Set `ctx._cinematicActive = true` to provide additional guard
3. Call `restoreStateHandlers(ctx, prevOnState, prevSetMessage)` before navigating away
4. Clear `ctx._cinematicActive = false` before navigation

The main encounter session's `ctx.onStateChange` checks `ctx._cinematicActive` and returns early if true, preventing any pending callbacks from forcing navigation.

## Adding New Adventures

1. Create `src/data/adventures/<adventure_name>_flow.js`:
   ```javascript
   export const adventureMeta = {
     id: '<adventure_name>',
     name: '<Display Name>',
     flow: [/* step array */]
   };
   ```

2. Register in `src/engine/adventure-flow.js`:
   ```javascript
   import { adventureMeta } from '../data/adventures/<adventure_name>_flow.js';
   
   const ADVENTURES = {
     '<adventure_name>': adventureMeta,
     // ... other adventures
   };
   ```

3. Create scene render functions matching the step IDs

4. Set `ctx.isAdventure = true` and initialize `ctx.meta.adventureProgress` when starting the adventure

## Debug Navigation

To bypass flow validation (for testing):

```javascript
navigate('any_route', { ctx, debug: true });
// or
navigate('any_route', { ctx, force: true });
```

The router will log the override but allow navigation.

## Testing

Manual playthrough checklist:
- Start adventure
- Verify each step appears in correct order
- Confirm no auto-battle during cinematics
- Test that user button clicks advance correctly
- Verify progress persists on save/load

Automated testing (future):
- Create `scripts/test_adventure_flow.js`
- Simulate ctx and validate each step transition
- Assert validateNavigate blocks out-of-order attempts
- Test debug flag override

## Current Adventures

- **Daggerford** (`daggerford`): Linear 12-step adventure (scenes → battles → choices → shop → final battle)
