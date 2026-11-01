#!/usr/bin/env python3
"""Build a self-contained offline HTML interface around the unchanged V1 header."""
import argparse,hashlib,json,pathlib,subprocess,tempfile
root=pathlib.Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--engine-js',type=pathlib.Path,help='Use an already compiled bridge (local verification only)')
a=p.parse_args()
header_sha=hashlib.sha256((root/'include/ratchet4.hpp').read_bytes()).hexdigest()
assert header_sha=='afc73d26c5c7b33448f6e11a33c081c3d719a70183b70801da3d5f32f81ef1ae','Approved header changed'
flags=['-std=c++17','-O3','-fexceptions','-sDISABLE_EXCEPTION_CATCHING=0','-sMODULARIZE=1','-sEXPORT_NAME=createRatchet','-sSINGLE_FILE=1','-sWASM_BIGINT=1','-sENVIRONMENT=web,node','-sFILESYSTEM=0','--no-entry']
version=subprocess.check_output(['em++','--version'],text=True).splitlines()[0]
with tempfile.TemporaryDirectory(prefix='ratchet4-ui-build-') as tmp:
    engine=a.engine_js or pathlib.Path(tmp)/'engine.js'
    command=['em++',str(root/'src/bridge.cpp'),'-I'+str(root/'include')]+flags+['-o',str(engine)]
    if not a.engine_js:subprocess.run(command,check=True)
    code=engine.read_text()
    info={'engine':'Ratchet-4 V1','engineHeaderSHA256':header_sha,'compiler':version,'engineJS_SHA256':hashlib.sha256(engine.read_bytes()).hexdigest(),'interfaceVersion':'1.0','engineUnchanged':True}
    html=(root/'src/template.html').read_text()
    notices=(root/'LICENSE').read_text()+'\n\nThird-party compiler/runtime notices:\n\n'+'\n\n'.join(p.read_text() for p in sorted((root/'third-party').glob('*.txt')))
    replacements={'__ENGINE_JS__':code,'__API_JS__':(root/'src/engine-api.js').read_text(),'__APP_JS__':(root/'src/app.js').read_text(),'__VECTORS__':json.dumps(json.loads((root/'tests/vectors.json').read_text()),separators=(',',':')),'__BUILD_INFO__':json.dumps(info,separators=(',',':')),'__LICENSE_NOTICES__':notices.replace('-->','-- >')}
    for token,value in replacements.items():
        assert html.count(token)==1,token
        html=html.replace(token,value.replace('</script','<\\/script'))
    (root/'P-RNG-Lab.html').write_text(html)
    (root/'evidence').mkdir(exist_ok=True)
    info.update(htmlSHA256=hashlib.sha256(html.encode()).hexdigest(),compilerFlags=flags,usedPrecompiledBridge=bool(a.engine_js))
    (root/'evidence/build.json').write_text(json.dumps(info,indent=2)+'\n')
    print(json.dumps(info))
