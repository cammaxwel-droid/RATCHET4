#!/usr/bin/env python3
# SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
"""Compile the dependent C++ adapter and original Ratchet into one offline HTML."""
import argparse,hashlib,json,pathlib,subprocess,tempfile
root=pathlib.Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--engine-out',type=pathlib.Path,help='Optional compiled bridge destination for automated Node checks');a=p.parse_args()
header=(root/'include/ratchet4.hpp').read_bytes()
assert hashlib.sha256(header).hexdigest()=='afc73d26c5c7b33448f6e11a33c081c3d719a70183b70801da3d5f32f81ef1ae','Original Ratchet is required'
flags=['-std=c++17','-O3','-fexceptions','-sDISABLE_EXCEPTION_CATCHING=0','-sMODULARIZE=1','-sEXPORT_NAME=createStrap','-sSINGLE_FILE=1','-sWASM_BIGINT=1','-sENVIRONMENT=web,node','-sFILESYSTEM=0','--no-entry']
version=subprocess.check_output(['em++','--version'],text=True).splitlines()[0]
with tempfile.TemporaryDirectory(prefix='strap-build-') as tmp:
    engine=pathlib.Path(tmp)/'engine.js'
    subprocess.run(['em++',str(root/'src/bridge.cpp'),'-I'+str(root/'include'),*flags,'-o',str(engine)],check=True)
    code=engine.read_text()
    if a.engine_out:a.engine_out.parent.mkdir(parents=True,exist_ok=True);a.engine_out.write_bytes(engine.read_bytes())
    info={'adapter':'Strap 1.0','sourceEngine':'Ratchet-4 V1','engineHeaderSHA256':hashlib.sha256(header).hexdigest(),'compiler':version,'compilerFlags':flags,'engineJS_SHA256':hashlib.sha256(engine.read_bytes()).hexdigest(),'originalEngineUnchanged':True}
    notices=(root/'LICENSE').read_text()+'\n\n'+'\n\n'.join(p.name+'\n'+p.read_text() for p in sorted((root/'licenses').glob('*.txt')))+'\n\nOriginal required Ratchet source (0BSD):\n'+header.decode()
    html=(root/'src/template.html').read_text()
    replacements={'__ENGINE_JS__':code,'__API_JS__':(root/'src/api.js').read_text(),'__APP_JS__':(root/'src/app.js').read_text(),'__VECTORS__':json.dumps(json.loads((root/'tests/ratchet-vectors.json').read_text()),separators=(',',':')),'__BUILD_INFO__':json.dumps(info,separators=(',',':')),'__NOTICES__':notices.replace('-->','-- >')}
    for token,value in replacements.items():
        assert html.count(token)==1,token
        html=html.replace(token,value.replace('</script','<\\/script'))
    output=root/'Strap-Lab.html';output.write_text(html)
    info['htmlSHA256']=hashlib.sha256(output.read_bytes()).hexdigest()
    (root/'evidence').mkdir(exist_ok=True);(root/'evidence/build.json').write_text(json.dumps(info,indent=2)+'\n')
    print(json.dumps(info))
