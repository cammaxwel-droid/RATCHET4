#!/usr/bin/env python3
# SPDX-License-Identifier: 0BSD
"""Compare the executable to a separately written mathematical model."""
import json
from pathlib import Path
import struct
import subprocess
import sys
from reference import MASK, Reference, advance, retreat


def output(exe, *args):
    return subprocess.check_output([str(exe), *map(str,args)])


def main(exe):
    seeds = [(0,0),(0,1),(1,0),(1,1),(MASK,MASK),(MASK,0),(0,MASK),
             (1<<63,0),(0,1<<63),(0xaaaaaaaaaaaaaaaa,0x5555555555555555)]
    seeds += [(1<<bit,0) for bit in range(64)] + [(0,1<<bit) for bit in range(64)]
    seeds += [(i,i+1) for i in range(128)]
    # Target the original V0 startup defect, including the two nonzero weak seeds.
    for seed in seeds[:10]:
        startup=struct.unpack('<4096Q',output(exe,'stream',4096*8,*seed,'raw'))
        observed_ones=0;observed_all_ones=MASK
        for value in startup:
            observed_ones|=value;observed_all_ones&=value
        assert observed_ones==MASK and observed_all_ones==0, f'stuck startup bit for {seed}'
    comparisons = 0
    for s0,s1 in seeds:
        ref=Reference(s0,s1)
        actual=output(exe,'raw',32,s0,s1).decode().splitlines()
        expected=[f'0x{ref.next():016x}' for _ in range(32)]
        if actual!=expected:
            raise AssertionError(f'raw mismatch for seed {(s0,s1)}')
        comparisons+=len(expected)
    fixtures=json.loads((Path(__file__).parent/'vectors.json').read_text())
    for case in fixtures:
        ref=Reference(*[int(v,16) for v in case['seed']])
        assert list(map(lambda x:f'0x{x:016x}',ref.state))==case['state_after_warmup']
        assert [f'0x{ref.next():016x}' for _ in case['outputs']]==case['outputs']
    for bound in (1,2,3,10,37,(1<<32)+1,(1<<63)+1,MASK):
        ref=Reference(0,MASK)
        expected=[str(ref.bounded(bound)) for _ in range(1024)]
        actual=output(exe,'bounded',1024,0,MASK,bound).decode().splitlines()
        assert expected==actual, f'bounded mismatch {bound}'
        comparisons+=len(expected)
    ref=Reference()
    words=[ref.next() for _ in range(128)]
    for mode,width in [('raw',8),('low',4),('high',4),('reverse',8)]:
        if mode=='raw': values=words
        elif mode=='low': values=[w&0xffffffff for w in words]
        elif mode=='high': values=[w>>32 for w in words]
        else: values=[int(f'{w:064b}'[::-1],2) for w in words]
        expected=b''.join(w.to_bytes(width,'little') for w in values)
        assert output(exe,'stream',width*128,0,0,mode)==expected,mode
    expected=b''.join(Reference(i,0).next().to_bytes(8,'little') for i in range(128))
    assert output(exe,'stream',1024,0,0,'nearby')==expected
    table=['Leaf','Twig','Stone','Leaf','Acorn','Twig','Crystal','Leaf']
    ref=Reference()
    indices=[ref.bounded(len(table)) for _ in range(64)]
    assert output(exe,'demo',64,0,0).decode().splitlines()==[f'index {i}  {table[i]}' for i in indices]
    for state in [(0,0,0,0,0),(MASK,MASK,MASK,MASK,MASK),(MASK,1,2,3,4)]:
        newer,_=advance(state)
        assert retreat(newer)==state
    bad=[('bounded',1,0,0,0),('bounded',0,0,0,0),('bounded',1,0,0,-1),
         ('raw',1,-1,0),('raw',1,1<<64,0),('raw','1.5',0,0),('raw',1,'0x',0),
         ('stream',7,0,0),('stream',8,0,0,'bad'),('demo',1,0),('raw',1000001,0,0)]
    for args in bad:
        result=subprocess.run([str(exe),*map(str,args)],capture_output=True)
        assert result.returncode==2 and b'Error:' in result.stderr and not result.stdout,args
    transcript=subprocess.check_output([str(exe)],input=b'\nseed 1 2\ndraw 3\nq\n').decode()
    assert transcript.count('index ')==13 and 'Seed set to (1,2)' in transcript
    print(json.dumps({'status':'PASS','reference_output_comparisons':comparisons,
                      'seed_cases':len(seeds),'invalid_cli_cases':len(bad),
                      'binary_formats_checked':5,'table_index_reference_checks':64,
                      'startup_window_seeds':10,'startup_words_per_seed':4096,'interactive_demo':'PASS'}))


if __name__=='__main__': main(Path(sys.argv[1]).resolve())
