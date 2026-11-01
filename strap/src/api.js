// SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
globalThis.STRAP=(()=>{
  const MAX=(1n<<64n)-1n,hex=x=>'0x'+x.toString(16).padStart(16,'0');
  function parse64(value,positive=false){
    if(typeof value==='number'&&!Number.isSafeInteger(value))throw Error('Pass large integers as decimal text, hexadecimal text, or BigInt.');
    const s=String(value).trim();
    if(!/^(?:[0-9]+|0x[0-9a-f]+)$/i.test(s))throw Error('Use a whole unsigned number, decimal or 0x hexadecimal.');
    const n=BigInt(s);if(n>MAX || (positive && n===0n))throw Error(positive?'Bound must be 1 through 18446744073709551615.':'Seed must be 0 through 18446744073709551615.');return n;
  }
  class Engine{
    constructor(module,a=0n,b=0n){this.m=module;this.p=module._pair_new(parse64(a),parse64(b));if(!this.p)throw Error('Engine allocation failed.');}
    alive(){if(!this.p)throw Error('Engine has been disposed.');}
    seed(a,b){this.alive();a=parse64(a);b=parse64(b);this.m._pair_seed(this.p,a,b);}
    next(){this.alive();const s=BigInt.asUintN(64,this.m._pair_next(this.p));return {ratchet:BigInt.asUintN(64,this.m._pair_original(this.p)),strap:s};}
    bounded(b){this.alive();b=parse64(b,true);const s=BigInt.asUintN(64,this.m._pair_bounded(this.p,b));if(this.m._pair_error(this.p))throw Error('Invalid bound.');return {ratchet:BigInt.asUintN(64,this.m._pair_original(this.p)),strap:s};}
    state(){this.alive();return Array.from({length:5},(_,i)=>hex(BigInt.asUintN(64,this.m._pair_state(this.p,i))));}
    dispose(){if(this.p)this.m._pair_delete(this.p);this.p=0;}
  }
  function checkEngine(module,vectors){
    let assertions=0;const groups=[];const check=(ok,message)=>{assertions++;if(!ok)throw Error(message);};
    try{
      for(const v of vectors){const e=new Engine(module,...v.seed);try{
        e.state().forEach((s,i)=>check(s===v.state_after_warmup[i],'Warm-up reference'));
        for(const x of v.outputs){const p=e.next();check(p.ratchet===BigInt(x),'Ratchet reference');check(p.strap===MAX-BigInt(x),'Strap reference');}
      }finally{e.dispose();}}
      groups.push('Frozen references: original and complement');
      for(const b of [1n,2n,3n,8n,37n,4294967297n,(1n<<63n)+1n,MAX]){
        const e=new Engine(module,0n,0n),raw=new Engine(module,0n,0n);try{
          for(let i=0;i<256;i++){
            let r=0n;if(b!==1n){const threshold=(1n<<64n)%b;do{r=raw.next().ratchet;}while(r<threshold);r%=b;}
            const p=e.bounded(b);check(p.ratchet===r && p.strap===b-1n-r,'Bounded mirror/rejection mapping');
            check(JSON.stringify(e.state())===JSON.stringify(raw.state()),'State consumption');
          }
        }finally{e.dispose();raw.dispose();}
      }
      groups.push('Eight bounds including rejection-heavy and maximum bounds');
      const e=new Engine(module,0n,0n);try{
        const before=JSON.stringify(e.state());
        for(const b of [0n,-1n,1n<<64n,'1.5',true,Number.MAX_SAFE_INTEGER+1]){let rejected=false;try{e.bounded(b);}catch{rejected=true;}check(rejected,'Invalid bound');check(JSON.stringify(e.state())===before,'Invalid bound no mutation');}
        module._pair_bounded(e.p,0n);check(module._pair_error(e.p)===1 && JSON.stringify(e.state())===before,'C++ zero bound validation');
        const x=e.next();e.seed(0n,0n);const y=e.next();check(x.ratchet===y.ratchet && x.strap===y.strap,'Replay');
      }finally{e.dispose();}
      groups.push('Input rejection, unchanged state, deterministic replay');
      return {status:'PASS',assertions,groups};
    }catch(error){return {status:'FAIL',assertions,groups,error:error.message};}
  }
  return {MAX,hex,parse64,Engine,checkEngine};
})();
