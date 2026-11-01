#!/usr/bin/env python3
# SPDX-License-Identifier: 0BSD
"""Optional Linux-hosted Windows binary checks; not native Windows validation."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tests'))
from reference import Reference,MASK


def main():
    p=argparse.ArgumentParser();p.add_argument('wine');p.add_argument('exe');p.add_argument('tests');p.add_argument('linux_exe');p.add_argument('prefix')
    a=p.parse_args();env=dict(os.environ,WINEDEBUG='-all',WINEPREFIX=str(Path(a.prefix).resolve()))
    def run(program,*args,input=None):
        return subprocess.run([a.wine,str(Path(program).resolve()),*map(str,args)],input=input,capture_output=True,env=env)
    check=run(a.tests)
    assert check.returncode==0,(check.stdout,check.stderr)
    seeds=[(0,0),(1,0),(0,1),(MASK,MASK),(1<<63,0),(0,1<<63)]
    for seed in seeds:
        r=run(a.exe,'raw',128,*seed);ref=Reference(*seed)
        assert r.returncode==0 and r.stdout.decode().splitlines()==[f'0x{ref.next():016x}' for _ in range(128)]
    for mode in ('raw','low','high','reverse','nearby'):
        r=run(a.exe,'stream',65536,0,0,mode)
        expected=subprocess.check_output([a.linux_exe,'stream','65536','0','0',mode])
        assert r.returncode==0 and r.stdout==expected,mode
    for arg in ('-1','0','18446744073709551616'):
        r=run(a.exe,'bounded',1,0,0,arg)
        assert r.returncode==2 and b'Error:' in r.stderr and not r.stdout
    demo=run(a.exe,input=b'\nseed 1 2\ndraw 3\nq\n')
    assert demo.returncode==0 and demo.stdout.count(b'index ')==13
    report={'status':'PASS','platform':'Wine on Linux, not native Windows 11',
            'wine_version':subprocess.check_output([a.wine,'--version']).decode().strip(),
            'cpp_test_output':check.stdout.decode().strip(),'raw_vector_words':768,
            'binary_formats':5,'bytes_compared_per_format':65536,
            'invalid_bound_cases':3,'interactive_demo':'PASS'}
    print(json.dumps(report,indent=2))


if __name__=='__main__':main()
