export function buildDeck(cardDefs, initialIds, rng){
  // Normalize inputs
  const ids = Array.isArray(initialIds) ? initialIds.slice() : [];
  // Build a lookup for cardDefs order so we can produce a deterministic hand
  const indexMap = Object.create(null);
  (Array.isArray(cardDefs) ? cardDefs : []).forEach((c,i) => { if(c && c.id) indexMap[c.id] = i; });
  // Sort supplied ids by their order in cardDefs (stable) to remove any caller randomness
  ids.sort((a,b) => (indexMap[a] || 0) - (indexMap[b] || 0));
  const cards = ids.map(id => ({...((cardDefs||[]).find(c=>c.id===id) || { id })}));
  // New behavior: no draw/discard piles. All character cards start in hand for the encounter
  // and preserve the deterministic order derived from `cardDefs`.
  const hand = cards.slice();
  return {
    hand,
    // drawing is removed; callers should not attempt to draw.
    playFromHand(cardIndex){
      return hand.splice(cardIndex,1)[0];
    },
    // discard/exhaust are intentionally no-ops to remove persistent piles during an encounter
    discardCard(){ /* no-op */ },
    exhaustCard(){ /* no-op */ },
    removeAll(){ hand.length = 0; }
  };
}
