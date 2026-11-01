// SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
// Descriptive diagnostics; no randomness acceptance threshold or certification.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'..');require(path.join(root,'src/api.js'));
(async()=>{
 const module=await require(path.resolve(process.argv[2]))(),N=65536,B=37n;
 const seeds=[[0n,0n],[1n,0n],[0n,1n],[1n,1n],[STRAP.MAX,STRAP.MAX],[STRAP.MAX,0n],[0n,STRAP.MAX],[1n<<63n,1n<<63n]],results=[];
 for(const seed of seeds){const e=new STRAP.Engine(module,...seed);try{
  const rBits=Array(64).fill(0),sBits=Array(64).fill(0),rHist=Array(Number(B)).fill(0),sHist=Array(Number(B)).fill(0);
  for(let i=0;i<N;i++){let p=e.next();assert.equal(p.ratchet^p.strap,STRAP.MAX);for(let bit=0;bit<64;bit++,p.ratchet>>=1n,p.strap>>=1n){rBits[bit]+=Number(p.ratchet&1n);sBits[bit]+=Number(p.strap&1n);}}
  e.seed(...seed);for(let i=0;i<N;i++){const p=e.bounded(B);assert.equal(p.ratchet+p.strap,B-1n);rHist[Number(p.ratchet)]++;sHist[Number(p.strap)]++;}
  assert(rBits.every((n,i)=>n+sBits[i]===N));assert(rHist.every((n,i)=>n===sHist[Number(B)-1-i]));
  results.push({seeds:seed.map(String),rawPairs:N,boundedPairs:N,bound:String(B),ratchetBitOnes:rBits,strapBitOnes:sBits,maxBitAbsZ:Math.max(...rBits.map(n=>Math.abs((n-N/2)/Math.sqrt(N/4)))),ratchetHistogram:rHist,strapHistogram:sHist,chiSquare:rHist.reduce((sum,n)=>sum+(n-N/Number(B))**2/(N/Number(B)),0),degreesOfFreedom:Number(B)-1});
 }finally{e.dispose();}}
 const evidence={status:'COMPLETED',mirrorInvariants:'PASS',node:process.version,seeds:results.length,totalRawPairs:seeds.length*N,totalBoundedPairs:seeds.length*N,rawBytes:seeds.length*N*8,interpretation:'Descriptive marginal counts only. The mirrored samples duplicate information, not independent evidence. Overlaps with UI/native samples are not additional independent coverage. No external suite was rerun and no multiple-testing inference is made.',results};
 fs.writeFileSync(path.join(root,'evidence/diagnostics.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({status:evidence.status,mirrorInvariants:evidence.mirrorInvariants,seedCases:evidence.seeds,maxBitAbsZ:Math.max(...results.map(r=>r.maxBitAbsZ)),chiSquares:results.map(r=>r.chiSquare)}));
})().catch(e=>{console.error(e);process.exitCode=1;});
