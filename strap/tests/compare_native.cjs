// SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
// node tests/compare_native.cjs ENGINE_JS ORIGINAL_RATCHET_NATIVE_EXE
const fs=require('fs'),path=require('path'),assert=require('assert'),cp=require('child_process');
const root=path.resolve(__dirname,'..');require(path.join(root,'src/api.js'));
(async()=>{
  const module=await require(path.resolve(process.argv[2]))();
  const vectors=JSON.parse(fs.readFileSync(path.join(__dirname,'ratchet-vectors.json')));
  const quick=STRAP.checkEngine(module,vectors);assert.equal(quick.status,'PASS',JSON.stringify(quick));
  let pairs=0;
  const strapVectors=JSON.parse(fs.readFileSync(path.join(__dirname,'strap-vectors.json')));
  for(const vector of strapVectors){const e=new STRAP.Engine(module,...vector.seed);try{for(const output of vector.outputs)assert.equal(e.next().strap,BigInt(output));}finally{e.dispose();}}
  const seeds=[[0n,0n],[1n,0n],[0n,1n],[1n,1n],[STRAP.MAX,STRAP.MAX],[STRAP.MAX,0n],[0n,STRAP.MAX],[123n,456n],...Array.from({length:64},(_,i)=>[1n<<BigInt(i),0n]),...Array.from({length:64},(_,i)=>[0n,1n<<BigInt(i)])];
  for(const seed of seeds){const e=new STRAP.Engine(module,...seed);try{
    const raw=cp.execFileSync(process.argv[3],['raw','128',...seed.map(String)],{encoding:'utf8'}).trim().split(/\s+/);
    raw.forEach(v=>{const p=e.next();assert.equal(p.ratchet,BigInt(v));assert.equal(p.strap,STRAP.MAX-BigInt(v));pairs++;});
    for(const b of [1n,2n,3n,8n,37n,4294967297n,(1n<<63n)+1n,STRAP.MAX]){
      e.seed(...seed);const values=cp.execFileSync(process.argv[3],['bounded','32',...seed.map(String),String(b)],{encoding:'utf8'}).trim().split(/\s+/);
      values.forEach(v=>{const p=e.bounded(b);assert.equal(p.ratchet,BigInt(v));assert.equal(p.strap,b-1n-BigInt(v));pairs++;});
    }
  }finally{e.dispose();}}
  const result={status:'PASS',pairedComparisons:pairs,frozenStrapReferenceOutputs:strapVectors.reduce((n,v)=>n+v.outputs.length,0),individualOutputsCompared:pairs*2,seedPairs:seeds.length,quickChecks:quick,node:process.version,platform:process.platform,baseline:'Previously compiled original Ratchet-4 V1 native CLI'};
  fs.writeFileSync(path.join(root,'evidence/native-equivalence.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
