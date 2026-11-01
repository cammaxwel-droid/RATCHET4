// SPDX-License-Identifier: 0BSD
// UI validation and bindings only. All draws run the compiled C++ engine.
(function(global) {
  'use strict';
  const MAX=(1n<<64n)-1n;
  const hex=v=>'0x'+v.toString(16).padStart(16,'0');
  function parse64(value,label='Value',positive=false) {
    const text=String(value).trim();
    if (!/^(?:[0-9]+|0x[0-9a-f]+)$/i.test(text)) throw new Error(`${label}: enter a whole decimal number or 0x hexadecimal.`);
    const n=BigInt(text);
    if(n>MAX || (positive && n===0n)) throw new Error(`${label} must be between ${positive?'1':'0'} and ${MAX}.`);
    return n;
  }
  class Engine {
    constructor(module,a=0n,b=0n) { this.module=module;this.pointer=module._rng_new(parse64(a,'Seed A'),parse64(b,'Seed B')); }
    next() { return BigInt.asUintN(64,this.module._rng_next(this.pointer)); }
    bounded(bound) {
      bound=parse64(bound,'Upper bound',true);
      const n=this.module._rng_bounded(this.pointer,bound);
      if(this.module._rng_error(this.pointer)) throw new Error('The C++ engine rejected this bound.');
      return BigInt.asUintN(64,n);
    }
    state() { return Array.from({length:5},(_,i)=>BigInt.asUintN(64,this.module._rng_state_word(this.pointer,i))); }
    seed(a,b) { a=parse64(a,'Seed A');b=parse64(b,'Seed B');this.module._rng_seed(this.pointer,a,b); }
    dispose() { if(this.pointer){this.module._rng_delete(this.pointer);this.pointer=0;} }
  }
  function checkEngine(module,vectors) {
    const groups=[];
    function group(name,fn) {
      let checks=0;
      const assert=(ok,message)=>{checks++;if(!ok)throw new Error(message);};
      try {fn(assert);groups.push({name,status:'PASS',checks});}
      catch(error){groups.push({name,status:'FAIL',checks,message:error.message});}
    }
    group('Frozen reference vectors: 10 seed pairs',assert=>{
      for(const v of vectors){const e=new Engine(module,...v.seed);try {
        e.state().forEach((s,i)=>assert(hex(s)===v.state_after_warmup[i],'Warm-up state mismatch'));
        v.outputs.forEach(w=>assert(hex(e.next())===w,'Reference output mismatch'));
      }finally{e.dispose();}}
    });
    group('Replay and stream continuation',assert=>{
      for(const seed of [[0n,0n],[123n,456n],[MAX,MAX]]) {
        const a=new Engine(module,...seed),b=new Engine(module,...seed);
        try {const first=Array.from({length:128},()=>a.next());const second=Array.from({length:128},()=>a.next());
          [...first,...second].forEach(v=>assert(v===b.next(),'Stream mismatch'));
          a.seed(...seed);first.forEach(v=>assert(v===a.next(),'Replay mismatch'));
        }finally{a.dispose();b.dispose();}
      }
    });
    group('Bounds and independent rejection mapping',assert=>{
      for(const seed of [[0n,0n],[MAX,MAX]])for(const bound of [1n,2n,3n,8n,37n,4294967297n,(1n<<63n)+1n,MAX]) {
        const a=new Engine(module,...seed),b=new Engine(module,...seed);
        try{for(let i=0;i<128;i++) {
          let expected=0n;
          if(bound!==1n){const threshold=(1n<<64n)%bound;let raw;do{raw=b.next();}while(raw<threshold);expected=raw%bound;}
          const actual=a.bounded(bound);
          assert(actual>=0n&&actual<bound,'Outside range');assert(actual===expected,'Mapping mismatch');
        }assert(a.state().every((v,i)=>v===b.state()[i]),'Wrong number of consumed raw words');}
        finally{a.dispose();b.dispose();}
      }
    });
    group('Invalid inputs rejected without advancing state',assert=>{
      const e=new Engine(module);try{
        const before=e.state();
        for(const value of ['', '-1','1.5','abc','0x','Infinity','18446744073709551616']) {
          let rejected=false;try{e.bounded(value);}catch(_){rejected=true;}assert(rejected,'Invalid input accepted');
        }
        module._rng_bounded(e.pointer,0n);assert(module._rng_error(e.pointer)===1,'C++ accepted zero bound');
        assert(e.state().every((v,i)=>v===before[i]),'Invalid input changed state');
        assert(e.bounded(1n)===0n,'Bound one must return zero');
        assert(e.state().every((v,i)=>v===before[i]),'Bound one consumed state');
      }finally{e.dispose();}
    });
    return {status:groups.every(g=>g.status==='PASS')?'PASS':'FAIL',checks:groups.reduce((n,g)=>n+g.checks,0),groups};
  }
  global.PRNG={Engine,parse64,hex,MAX,checkEngine};
})(typeof globalThis==='object'?globalThis:window);
