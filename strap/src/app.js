// SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
(async()=>{
  const $=id=>document.getElementById(id),{Engine,parse64,hex,MAX}=STRAP;
  const labels=['Leaf','Twig','Stone','Leaf','Acorn','Twig','Crystal','Leaf'];
  const buttonIds=['apply','replay','draw1','draw10','draw1000','checks','sample','export'];
  let module,engine,seeds=[0n,0n],calls=0,history=[],counts={ratchet:Array(8).fill(0),strap:Array(8).fill(0)},checks=null,sample=null;
  function error(message=''){ $('error').textContent=message;$('error').hidden=!message; }
  function busy(value){buttonIds.forEach(id=>$(id).disabled=value);}
  function report(){return {adapter:'Strap 1.0',engine:'Ratchet-4 V1',seeds:seeds.map(String),calls,counts,history,checks,sample,currentState:engine.state(),build:BUILD_INFO,meaning:'Paired outputs are fully dependent. No payout or fairness certification.'};}
  function render(){
    $('counter').textContent=calls.toLocaleString()+' pairs drawn';$('state').textContent='counter, x, y, z, w\n'+engine.state().join('\n');
    $('chart').replaceChildren();const peak=Math.max(1,...counts.ratchet,...counts.strap);
    for(let i=0;i<8;i++){
      const bin=document.createElement('div');bin.className='bin';const bars=document.createElement('div');bars.className='bars';
      for(const kind of ['ratchet','strap']){const bar=document.createElement('div');bar.className='bar'+(kind==='strap'?' s':'');bar.style.height=(counts[kind][i]/peak*88)+'px';bar.title=kind+': '+counts[kind][i];bars.append(bar);}
      bin.append(bars,document.createTextNode(i+' · '+labels[i]),document.createElement('br'),document.createTextNode(counts.ratchet[i]+' / '+counts.strap[i]));$('chart').append(bin);
    }
    $('history').replaceChildren();
    for(const entry of [...history].reverse()){
      const row=document.createElement('tr');for(const value of [entry.draw,entry.mode,entry.ratchet,entry.strap]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}$('history').append(row);
    }
    if(!history.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4;cell.textContent='Draw a pair to begin.';row.append(cell);$('history').append(row);}
  }
  function reset(a,b){
    engine.seed(a,b);seeds=[a,b];calls=0;history=[];counts={ratchet:Array(8).fill(0),strap:Array(8).fill(0)};sample=null;
    for(const kind of ['ratchet','strap']){$(kind+'Value').textContent='—';$(kind+'Value').className='value';$(kind+'Detail').textContent='Ready for the first draw.';}
    $('relationship').textContent='Table pairs sum to 7 · raw bits are exact opposites';$('sampleStatus').textContent='The sample uses a separate engine and preserves your live sequence.';error();render();
  }
  function draw(n){
    try{
      error();const mode=$('mode').value,bound=mode==='raw'?null:(mode==='table'?8n:parse64($('bound').value,true));let last;
      for(let i=0;i<n;i++){
        const pair=mode==='raw'?engine.next():engine.bounded(bound);calls++;last=pair;
        const entry={draw:calls,mode,bound:bound===null?null:String(bound),ratchet:mode==='raw'?hex(pair.ratchet):String(pair.ratchet),strap:mode==='raw'?hex(pair.strap):String(pair.strap)};
        history.push(entry);if(history.length>40)history.shift();if(mode==='table'){counts.ratchet[Number(pair.ratchet)]++;counts.strap[Number(pair.strap)]++;}
      }
      for(const kind of ['ratchet','strap']){
        $(kind+'Value').textContent=mode==='raw'?hex(last[kind]):String(last[kind]);$(kind+'Value').className='value'+(mode==='raw'||String(last[kind]).length>12?' compact':'');
        $(kind+'Detail').textContent=mode==='table'?labels[Number(last[kind])]:(mode==='raw'?'Unsigned 64-bit word':'Index in [0, '+(bound-1n)+']');
      }
      $('relationship').textContent=mode==='raw'?'Mirror verified · every corresponding bit is opposite':'Mirror verified · '+last.ratchet+' + '+last.strap+' = '+(bound-1n);
      render();
    }catch(e){error(e.message);}
  }
  try{
    module=await createStrap();engine=new Engine(module);$('runtime').textContent='Original Ratchet + Strap ready';$('build').textContent=JSON.stringify(BUILD_INFO,null,2);busy(false);render();
    $('apply').onclick=()=>{try{const a=parse64($('seedA').value),b=parse64($('seedB').value);reset(a,b);}catch(e){error(e.message);}};
    $('replay').onclick=()=>{$('seedA').value=String(seeds[0]);$('seedB').value=String(seeds[1]);reset(...seeds);};
    $('mode').onchange=()=>{$('boundWrap').hidden=$('mode').value!=='bounded';error();};
    [1,10,1000].forEach(n=>$('draw'+n).onclick=()=>draw(n));
    $('checks').onclick=async()=>{busy(true);$('checkStatus').textContent='Checking compiled engine…';await new Promise(r=>setTimeout(r,20));try{checks=STRAP.checkEngine(module,REFERENCE_VECTORS);$('checkStatus').textContent=checks.status+' · '+checks.assertions.toLocaleString()+' assertions\n'+(checks.error||'Original references, mirror mapping, input rejection and replay.');}catch(e){error(e.message);}finally{busy(false);}};
    $('sample').onclick=async()=>{
      busy(true);$('sampleStatus').textContent='Inspecting 65,536 raw pairs…';await new Promise(r=>setTimeout(r,20));const e=new Engine(module,...seeds);
      try{
        const n=65536,onesR=Array(64).fill(0),onesS=Array(64).fill(0);let mismatches=0;
        for(let i=0;i<n;i++){const p=e.next();if((p.ratchet^p.strap)!==MAX)mismatches++;let r=p.ratchet,s=p.strap;for(let b=0;b<64;b++,r>>=1n,s>>=1n){onesR[b]+=Number(r&1n);onesS[b]+=Number(s&1n);}}
        const maxAbsZ=Math.max(...onesR.map(c=>Math.abs((c-n/2)/Math.sqrt(n/4))));
        sample={rawPairs:n,seeds:seeds.map(String),mismatches,ratchetBitOnes:onesR,strapBitOnes:onesS,maxAbsZ,meaning:'Descriptive bit counts, not an independence or randomness certification.'};
        $('sampleStatus').textContent=n.toLocaleString()+' pairs · '+mismatches+' mirror mismatches\nBit counts sum to '+n.toLocaleString()+' at every position; largest |z| '+maxAbsZ.toFixed(3)+'.';
      }catch(e){error(e.message);}finally{e.dispose();busy(false);}
    };
    $('export').onclick=()=>{const link=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}));link.href=url;link.download='strap-review.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    window.strapLab={getReport:()=>JSON.parse(JSON.stringify(report())),getState:()=>engine.state()};
    window.addEventListener('pagehide',()=>engine.dispose());
  }catch(e){$('runtime').textContent='Engine could not start';error(e.message+' Open this file in an up-to-date browser with WebAssembly enabled.');}
})();
