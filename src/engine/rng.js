export function createRNG(seed){
  // simple LCG
  let state = seed ? Number(seed) & 0xffffffff : Math.floor(Math.random()*0xffffffff);
  return {
    next(){ state = (1664525 * state + 1013904223) >>> 0; return state; },
    rand(){ return this.next() / 0xffffffff; },
    int(max){ return Math.floor(this.rand()*max); },
    shuffle(arr){
      const a = arr.slice();
      for(let i=a.length-1;i>0;i--){
        const j=this.int(i+1);
        [a[i],a[j]]=[a[j],a[i]];
      }
      return a;
    }
  };
}
