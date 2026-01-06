// Daggerford Adventure Flow
// Defines the canonical linear progression for the Daggerford adventure.
// Each step must be completed in order; the runtime engine enforces this sequence
// to prevent background session callbacks from auto-navigating out of order.

export const daggerfordFlow = [
  // 1. Opening scene: Cree arrives in Daggerford
  { type: 'scene', id: 'adventure_daggerford_scene_1', enemyBefore: null },
  
  // 2. Battle: thugs attack
  { type: 'battle', id: 'battle', enemyKey: 'thug' },
  
  // 3. First choice: return or keep the gold
  { type: 'choice', id: 'adventure_daggerford_choice_1' },
  
  // 4. Choice 1 result: player receives reward based on choice
  { type: 'choice_result', id: 'adventure_daggerford_choice_1_result' },
  
  // 5. Tavern scene: meet Syranna, recruit companion
  { type: 'scene', id: 'adventure_daggerford_scene_2', enemyBefore: null },
  
  // 6. Battle: Red Wizard fight
  { type: 'battle', id: 'battle', enemyKey: 'red_wizard' },
  
  // 7. Second choice: let wizard live or kill
  { type: 'choice', id: 'adventure_daggerford_choice_2' },
  
  // 8. Choice 2 result: receive reward and learn about Szass Tam
  { type: 'choice_result', id: 'adventure_daggerford_choice_2_result' },
  
  // 9. Scene 3: Syranna reveals Szass Tam has returned
  { type: 'scene', id: 'adventure_daggerford_scene_3', enemyBefore: null },
  
  // 10. Shop: prepare for final battle - general adventure shop, then Daggerford-specific shop
  { type: 'shop', id: 'adventure_shop' },
  { type: 'shop', id: 'adventure_daggerford_shop' },
  
  // 11. Final battle: Szass Tam
  { type: 'battle', id: 'battle', enemyKey: 'szass_tam_daggerford_adventure' },
  
  // 12. Victory: adventure complete
  { type: 'victory', id: 'adventure_daggerford_victory' }
];

// Export adventure metadata
export const daggerfordMeta = {
  id: 'daggerford',
  name: 'Daggerford',
  description: 'Cree\'s first adventure in the city of Daggerford',
  flow: daggerfordFlow
};
