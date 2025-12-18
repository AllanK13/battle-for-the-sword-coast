export function buildDeck(cardDefs, initialIds, rng){
  const cards = initialIds.map(id => ({...cardDefs.find(c=>c.id===id)}));
  const draw = rng ? rng.shuffle(cards) : cards.slice();
  const hand = [];
  const discard = [];
  const exhausted = [];
  return {
    draw, hand, discard, exhausted,
    drawN(n){
      const drawn = [];
      for(let i=0;i<n;i++){
        if(draw.length===0){
          if(discard.length===0) break;
          // reshuffle discard
          const reshuffled = rng ? rng.shuffle(discard.splice(0)) : discard.splice(0);
          draw.push(...reshuffled);
        }
        drawn.push(draw.shift());
      }
      hand.push(...drawn);
      return drawn;
    },
    playFromHand(cardIndex){
      // remove from hand but do not place into discard (placement handles discard/exhaust)
      return hand.splice(cardIndex,1)[0];
    },
    discardCard(card){ discard.push(card); },
    exhaustCard(card){ exhausted.push(card); },
    removeAll(){ hand.length=0; draw.length=0; discard.length=0; exhausted.length=0; }
  };
}
