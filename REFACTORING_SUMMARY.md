# Code Refactoring Summary

## Overview
This document summarizes the code cleanup and refactoring performed to reduce redundancies and improve maintainability across the codebase, with particular focus on `main.js`, `encounter.js`, and `battle.js`.

## New Helper Modules Created

### 1. `src/engine/helpers.js`
Common utility functions used across multiple modules:

**Music & Audio:**
- `getMusicPaths(filename)` - Generate music file path candidates
- `getSfxPaths()` - Get standard SFX file paths
- `initMusic(filename)` - Initialize music with standard settings

**Name Extraction:**
- `getHeroName(hero, slotIndex)` - Extract hero name with fallback to slot number
- `getEnemyName(enemy)` - Extract enemy name with fallback to 'Enemy'

**State Management:**
- `disableStateHandlers(ctx)` - Temporarily disable state update handlers
- `restoreStateHandlers(ctx, prevOnState, prevSetMessage)` - Restore disabled handlers

**Meta/Stats Helpers:**
- `shouldSaveToGlobal(ctx)` - Determine if meta should save to global or adventure temp
- `updateMetaStat(meta, key, value, ctx)` - Update a meta stat with proper save isolation
- `updateEnemyCount(meta, enemyKey, countType, ctx)` - Increment enemy-specific counters
- `saveMetaIfAllowed(meta, ctx)` - Save meta to appropriate location (global vs temp)

**Ability Helpers:**
- `getAbilityApCost(ability)` - Extract AP cost from ability definition
- `getAbilityCooldown(ability)` - Extract cooldown from ability definition
- `buildAbilityCooldownKey(cardId, abilityIndex)` - Build cooldown tracking key

### 2. `src/ui/battle-helpers.js`
UI-specific helpers for battle screen rendering:

**Status Icons:**
- `STATUS_ICON_CONFIG` - Lookup table mapping status IDs to emoji and title generators
- `getStatusIconData(statusIcon)` - Get emoji and title for any status icon

**Hero Variants:**
- `getGriffVariant(ctx)` - Get stable Griff image variant for current encounter

**Ability Buttons:**
- `getAbilityButtonConfig(ability, abilityIndex, slotObj, slotIndex, currentAp, ctx)` - Build button configuration with all attributes, disabled state, cooldown badges

### 3. `src/engine/encounter-helpers.js`
Encounter-specific combat logic helpers:

**Ability & Damage Parsing:**
- `getPrimaryAbility(card)` - Extract primary ability from card
- `parseDamageFromAbility(ability)` - Parse damage value from ability text
- `calculateHitChance(baseHit, hitBonus)` - Calculate final hit chance
- `calculateFinalDamage(baseDamage, isCrit, isEnfeebled)` - Calculate damage with modifiers

**Hero Management:**
- `applyDamageToHero(hero, damage, encounter, events, slot)` - Apply damage with temp HP absorption
- `killHero(hero, events, encounter, slot)` - Kill hero and add to exhausted list

**Event Creation:**
- `createHitEvent(heroName, slot, tempTaken, hpTaken, remainingHp, attackType, attackName, missed, crit, died)` - Create standardized hit event
- `createProtectedEvent(heroName, slot, attackName)` - Create gaseous form protection event

**Combat Checks:**
- `isHeroImmuneToAoE(hero)` - Check if hero has gaseous form protection
- `rollRandom(encounter)` - Get random number from encounter RNG
- `checkHit(hitChance, rng)` - Roll for hit/miss
- `checkCrit(encounter)` - Roll for critical hit

**Ability Resolution:**
- `getSelectedAbility(hero, abilityIndex)` - Get ability from hero with validation

## Files Refactored

### `src/engine/encounter.js`
**Changes:**
- Added imports from `encounter-helpers.js`
- Removed duplicate functions: `parseDamageFromAbility`, `getPrimaryAbility`, `checkHit`, `checkCrit`, `_rngRoll`
- Refactored `resolveSingleTargetAttack` to use `applyDamageToHero`, `killHero`, `createHitEvent`
- Refactored `resolveAoEAttack` to use `isHeroImmuneToAoE`, `createProtectedEvent`, `applyDamageToHero`
- Simplified `playHeroAttack` to use `getSelectedAbility`, `calculateHitChance`, `calculateFinalDamage`
- Simplified `playHeroAction` ability selection to use `getSelectedAbility`

**Impact:** ~150 lines of duplicate/redundant code removed

### `src/main.js`
**Changes:**
- Added imports from `helpers.js`
- Created `initMusic` helper function for music initialization
- Replaced 5 music initialization blocks with `initMusic('filename.mp3')` calls
- Replaced 10+ hero/enemy name extraction patterns with `getHeroName`/`getEnemyName` helpers
- Replaced 4 state handler disable/restore patterns with `disableStateHandlers`/`restoreStateHandlers`
- Replaced 3 complex meta stat update sections with `updateMetaStat`, `updateEnemyCount`, `saveMetaIfAllowed`
- Simplified SFX path definitions with `getSfxPaths()`

**Impact:** ~100+ lines of redundant code consolidated into helper calls

### `src/ui/screens/battle.js`
**Changes:**
- Added imports from `battle-helpers.js`
- Replaced 40-line status icon switch statement with 3-line `getStatusIconData` call
- Replaced 20-line Griff variant selection logic with 1-line `getGriffVariant` call
- Replaced 30-line ability button creation loop with 10-line implementation using `getAbilityButtonConfig`

**Impact:** ~60 lines of complex UI logic simplified with helper functions

## Benefits

1. **Reduced Redundancy:** Eliminated 300+ lines of duplicate code across three main files
2. **Improved Maintainability:** Changes to common patterns now require updates in one place instead of many
3. **Better Testability:** Extracted functions can be unit tested independently
4. **Enhanced Readability:** Main logic files are now more focused on business logic rather than implementation details
5. **Consistent Behavior:** Common operations (name extraction, music init, stat updates) now work identically everywhere

## Testing Recommendations

After refactoring, test the following scenarios:
1. ✅ Music initialization on different screens (arcade_start, adventure_start, battle, upgrades)
2. ✅ Hero and enemy name display in battle messages
3. ✅ Status icon display and tooltips
4. ✅ Griff variant selection remains stable within encounters
5. ✅ Ability button creation with AP costs and cooldowns
6. ✅ Meta stat updates for arcade vs adventure modes
7. ✅ State handler disable/restore during encounter end screens
8. ✅ Damage application and hero death handling

## Future Refactoring Opportunities

- Consider extracting deck rebuild logic from `main.js` into a deck helper
- Consider creating a battle music selection helper if the pattern is reused
- Look for opportunities to consolidate message formatting in `main.js` endTurn handler
