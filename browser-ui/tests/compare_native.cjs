// SPDX-License-Identifier: 0BSD
// Usage: node compare_native.cjs ENGINE_JS NATIVE_EXE
const fs=require('fs'),path=require('path'),assert=require('assert'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
require(path.join(root,'src/engine-api.js'));
(async()=>{
  const module=await require(path.resolve(process.argv[2]))();
  const vectors=JSON.parse(fs.readFileSync(path.join(__dirname,'vectors.json')));
  const quick=PRNG.checkEngine(module,vectors);assert.equal(quick.status,'PASS',JSON.stringify(quick));
  let compared=0;
  const seeds=[[0n,0n],[1n,0n],[0n,1n],[1n,1n],[PRNG.MAX,PRNG.MAX],[1n<<63n,0n],[0n,1n<<63n],[123n,456n],
    ...Array.from({length:64},(_,i)=>[1n<<BigInt(i),0n]),...Array.from({length:64},(_,i)=>[0n,1n<<BigInt(i)])];
  for(const seed of seeds){
    const e=new PRNG.Engine(module,...seed);
    try{
      const raw=cp.execFileSync(process.argv[3],['raw','128',...seed.map(String)],{encoding:'utf8'}).trim().split(/\s+/);
      raw.forEach(v=>{assert.equal(e.next(),BigInt(v));compared++;});
      for(const bound of [1n,2n,3n,8n,37n,4294967297n,(1n<<63n)+1n,PRNG.MAX]){
        e.seed(...seed);
        const bounded=cp.execFileSync(process.argv[3],['bounded','32',...seed.map(String),String(bound)],{encoding:'utf8'}).trim().split(/\s+/);
        bounded.forEach(v=>{assert.equal(e.bounded(bound),BigInt(v));compared++;});
      }
    }finally{e.dispose();}
  }
  const result={status:'PASS',nativeComparisons:compared,seedPairs:seeds.length,quickChecks:quick,host:process.platform,node:process.version};
  fs.writeFileSync(path.join(root,'evidence/native-equivalence.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
