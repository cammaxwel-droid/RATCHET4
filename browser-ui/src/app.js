// SPDX-License-Identifier: 0BSD
(async function(){
  'use strict';
  const $=id=>document.getElementById(id), labels=['Leaf','Twig','Stone','Leaf','Acorn','Twig','Crystal','Leaf'];
  const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
  let module,engine,seeds=[0n,0n],calls=0,rawUsed=0n,counts=Array(8).fill(0),history=[],checkReport=null,sampleReport=null,busy=false;
  function showError(e){$('error').textContent=e.message||String(e);$('error').hidden=false;}
  function clearError(){$('error').hidden=true;}
  function locked(value){busy=value;document.querySelectorAll('[data-engine]').forEach(b=>b.disabled=value||!engine);$('mode').disabled=value;$('bound').disabled=value;$('seedA').disabled=value;$('seedB').disabled=value;}
  function render(){
    $('selections').textContent=calls.toLocaleString();$('rawUsed').textContent=rawUsed.toLocaleString();
    $('activeSeeds').textContent=`Active seeds: ${seeds[0]} / ${seeds[1]}`;
    $('state').textContent=engine.state().map((v,i)=>`${['counter','x','y','z','w'][i].padEnd(7)} ${PRNG.hex(v)}`).join('\n');
    $('history').replaceChildren();
    if(!history.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=3;td.className='empty';td.textContent='Draw a value to start the sequence.';tr.append(td);$('history').append(tr);}
    for(const entry of [...history].reverse()){
      const tr=document.createElement('tr');for(const value of [entry.call,entry.mode==='bounded'?`bounded / ${entry.bound}`:entry.mode,entry.display]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('history').append(tr);
    }
    const total=counts.reduce((a,b)=>a+b,0),max=Math.max(total*.25,...counts,1);
    $('tableTotal').textContent=`${total.toLocaleString()} table selections`;
    $('bars').replaceChildren();
    counts.forEach((count,i)=>{
      const bin=document.createElement('div');bin.className='bin';
      const track=document.createElement('div');track.className='track';
      // The reference line tracks 12.5%, including when an extreme observed bin sets the scale.
      const expected=total ? (total/8/max)*100 : 50;
      track.style.setProperty('--expected',`${expected}%`);
      const fill=document.createElement('div');fill.className='fill';fill.style.height=`${count/max*100}%`;track.append(fill);
      const title=document.createElement('strong');title.textContent=`${i} · ${labels[i]}`;
      const value=document.createElement('div');value.className='count';value.textContent=count.toLocaleString();
      bin.append(track,title,value);bin.title=`Index ${i}, ${labels[i]}: ${count}, ${total?(100*count/total).toFixed(2):'0.00'}%`; $('bars').append(bin);
    });
    $('bars').setAttribute('aria-label',counts.map((v,i)=>`Index ${i} ${labels[i]}: ${v}`).join('; '));
  }
  function reset(newSeeds){
    seeds=newSeeds;engine.seed(...seeds);calls=0;rawUsed=0n;counts=Array(8).fill(0);history=[];sampleReport=null;
    $('seedA').value=seeds[0].toString();$('seedB').value=seeds[1].toString();
    $('last').textContent='Ready to draw';$('resultHint').textContent='Sequence reset to the active seeds.';
    $('bitbars').hidden=true;$('sampleResult').textContent='Descriptive only. No statistical pass/fail verdict.';render();
  }
  async function draw(amount){
    if(busy||!engine)return;clearError();
    try{
      const mode=$('mode').value,bound=mode==='bounded'?PRNG.parse64($('bound').value,'Upper bound',true):8n;
      locked(true);
      for(let start=0;start<amount;start+=100){
        for(let i=start;i<Math.min(start+100,amount);i++){
          const before=engine.state()[0],value=mode==='raw'?engine.next():engine.bounded(bound);
          rawUsed+=(engine.state()[0]-before)&PRNG.MAX;calls++;
          const display=mode==='table'?`${value} · ${labels[Number(value)]}`:mode==='raw'?PRNG.hex(value):value.toString();
          if(mode==='table')counts[Number(value)]++;
          history.push({call:calls,mode,bound:mode==='bounded'?bound.toString():mode==='table'?'8':null,value:value.toString(),display});
          if(history.length>40)history.shift();
        }
        if(amount>100)await tick();
      }
      $('last').textContent=history[history.length-1].display;
      $('resultHint').textContent=mode==='raw'?'Unsigned 64-bit output · hexadecimal':mode==='bounded'?`Valid range: 0 through ${bound-1n}`:'Selected table entry · index 0 through 7';
      render();
    }catch(error){showError(error);}finally{locked(false);}
  }
  $('mode').addEventListener('change',()=>{$('boundWrap').hidden=$('mode').value!=='bounded';clearError();});
  $('apply').addEventListener('click',()=>{clearError();try{reset([PRNG.parse64($('seedA').value,'Seed A'),PRNG.parse64($('seedB').value,'Seed B')]);}catch(e){showError(e);}});
  $('replay').addEventListener('click',()=>{clearError();reset([...seeds]);});
  for(const count of [1,10,1000])$('draw'+count).addEventListener('click',()=>draw(count));
  $('checks').addEventListener('click',async()=>{
    clearError();locked(true);$('checkState').textContent='Checking…';$('checkState').className='checkstate busy';await tick();
    try{
      checkReport={...PRNG.checkEngine(module,REFERENCE_VECTORS),runAt:new Date().toISOString()};
      $('checkState').textContent=checkReport.status==='PASS'?'Correctness checks passed':'Check failed';$('checkState').className='checkstate '+(checkReport.status==='PASS'?'pass':'fail');
      $('checkSummary').textContent=`${checkReport.checks.toLocaleString()} assertions · ${checkReport.groups.length} groups`;
      $('checkList').replaceChildren();
      for(const g of checkReport.groups){const li=document.createElement('li'),label=document.createElement('span'),status=document.createElement('b');label.textContent=g.name+(g.message?': '+g.message:'');status.textContent=g.status;status.className=g.status==='PASS'?'pass':'fail';li.append(label,status);$('checkList').append(li);}
    }catch(e){showError(e);$('checkState').textContent='Unable to complete checks';$('checkState').className='checkstate fail';}finally{locked(false);}
  });
  $('sample').addEventListener('click',async()=>{
    clearError();locked(true);let probe;
    try{
      probe=new PRNG.Engine(module,...seeds);const n=65536,bits=Array(64).fill(0),start=performance.now();
      for(let i=0;i<n;i++){
        const word=probe.next(),lo=Number(word&0xffffffffn),hi=Number(word>>32n);
        for(let b=0;b<32;b++){bits[b]+=(lo>>>b)&1;bits[b+32]+=(hi>>>b)&1;}
        if(i%4096===4095){$('sampleResult').textContent=`Sampling ${(i+1).toLocaleString()} / ${n.toLocaleString()} words…`;await tick();}
      }
      const z=bits.map(k=>(k-n/2)/Math.sqrt(n/4)),maxZ=Math.max(...z.map(Math.abs));
      sampleReport={seeds:seeds.map(String),rawWords:n,onesByBit:bits,zByBit:z,maxAbsZ:maxZ,elapsedMs:performance.now()-start,verdict:null,limitation:'Descriptive single-seed bit frequencies; no calibrated randomness pass/fail verdict.'};
      $('bitbars').replaceChildren();bits.forEach((count,i)=>{const bar=document.createElement('i');bar.style.height=`${100*count/n}%`;bar.title=`Bit ${i}: ${(100*count/n).toFixed(2)}% ones`;$('bitbars').append(bar);});$('bitbars').hidden=false;
      $('sampleResult').textContent=`${n.toLocaleString()} words · largest |z| = ${maxZ.toFixed(3)} across 64 bits. Descriptive only; not a pass/fail verdict.`;
    }catch(e){showError(e);}finally{if(probe)probe.dispose();locked(false);}
  });
  $('export').addEventListener('click',()=>{
    const report={product:'Ratchet-4 V1 browser review',status:'Experimental; statistical quality unresolved',build:BUILD_INFO,savedAt:new Date().toISOString(),browser:navigator.userAgent,activeSeeds:seeds.map(String),calls,rawWordsConsumed:rawUsed.toString(),currentState:engine.state().map(PRNG.hex),tableCounts:counts,history,checks:checkReport,bitSample:sampleReport};
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='P-RNG-review-report.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  });
  try {
    if(typeof BigInt!=='function'||typeof WebAssembly!=='object')throw new Error('Open this file in a current version of Microsoft Edge, Chrome or Firefox.');
    module=await createRatchet();engine=new PRNG.Engine(module);render();locked(false);
    $('runtime').replaceChildren();const dot=document.createElement('span');dot.className='dot';$('runtime').append(dot,'C++ engine ready · offline');
    window.reviewLab={getState:()=>engine.state().map(PRNG.hex),getReport:()=>({calls,rawUsed:rawUsed.toString(),seeds:seeds.map(String),history:[...history],counts:[...counts],checks:checkReport,sample:sampleReport})};
  }catch(e){$('runtime').textContent='Engine could not start';showError(e);locked(true);}
})();
