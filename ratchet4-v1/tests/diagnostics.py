#!/usr/bin/env python3
# SPDX-License-Identifier: 0BSD
"""Exploratory screens, not certification; NumPy is an optional dependency."""
import argparse
import json
from pathlib import Path
import subprocess
import numpy as np

MASK=(1<<64)-1


def words(exe,seed,n):
    data=subprocess.check_output([str(exe),'stream',str(8*n),*map(str,seed),'raw'])
    return np.frombuffer(data,dtype='<u8')


def bits(values):
    return np.unpackbits(np.ascontiguousarray(values,dtype='<u8').view(np.uint8).reshape(-1,8),axis=1,bitorder='little')


def main():
    p=argparse.ArgumentParser();p.add_argument('exe',type=Path);p.add_argument('probe',type=Path);p.add_argument('out',type=Path)
    a=p.parse_args(); a.exe=a.exe.resolve();a.probe=a.probe.resolve()
    n=1<<18
    seeds=[(0,0),(1,0),(0,1),(1,1),(MASK,MASK),(MASK,0),(0,MASK),(1<<63,0),(0,1<<63),
           (0xaaaaaaaaaaaaaaaa,0x5555555555555555),(0x5555555555555555,0xaaaaaaaaaaaaaaaa),
           (2,0),(0,2),(2,2),(123,456),(MASK-1,MASK)]
    results=[]
    for seed in seeds:
        values=words(a.exe,seed,n); b=bits(values)
        counts=b.sum(axis=0)
        z=(counts-n/2)/np.sqrt(n/4)
        serial={}
        for lag in (1,8,64):
            changes=np.count_nonzero(b[lag:]!=b[:-lag],axis=0)
            serial[str(lag)]=((changes-(n-lag)/2)/np.sqrt((n-lag)/4)).tolist()
        byte_values=values.view(np.uint8).reshape(-1,8)
        chi=[]
        for pos in range(8):
            freq=np.bincount(byte_values[:,pos],minlength=256)
            chi.append(float(np.sum((freq-n/256)**2/(n/256))))
        record={'seed':[f'0x{x:016x}' for x in seed], 'words':n,'ones_per_bit':counts.tolist(),
                'bit_frequency_z':z.tolist(),'serial_change_z_by_lag':serial,'byte_chi_squared_df255':chi,
                'duplicate_outputs':int(n-np.unique(values).size),
                'max_abs_frequency_z':float(np.max(np.abs(z))),
                'max_abs_serial_z':max(abs(x) for v in serial.values() for x in v)}
        results.append(record)
    # Deterministic bases; no established RNG is used to choose seeds.
    bases=[(i, (i*i*i) ^ MASK) for i in range(256)]
    queries=[]
    for s0,s1 in bases:
        queries.append((s0,s1))
        queries += [(s0^(1<<bit),s1) for bit in range(64)]
        queries += [(s0,s1^(1<<bit)) for bit in range(64)]
    payload=''.join(f'{s0} {s1}\n' for s0,s1 in queries).encode()
    raw=subprocess.check_output([str(a.probe)],input=payload).splitlines()
    v=np.array([int(x) for x in raw],dtype=np.uint64).reshape(256,129)
    differences=v[:,1:] ^ v[:,:1]
    changed=bits(differences.reshape(-1)).reshape(256,128,64)
    avalanche=changed.sum(axis=0)
    # np.sum of uint8 yields uint64: cast BEFORE subtraction to avoid wrap.
    calibration=(np.array([0,128,256],dtype=np.uint64).astype(np.float64)-128)/8
    assert calibration.tolist()==[-16.0,0.0,16.0]
    avalanche_z=(avalanche.astype(np.float64)-128)/8
    assert np.max(np.abs(avalanche_z))<=16
    pairs=[]
    for i in range(8):
        left=(2*i,0);right=(2*i+1,0);size=1<<16
        xor_bits=bits(words(a.exe,left,size)^words(a.exe,right,size))
        pair_z=(xor_bits.sum(axis=0)-size/2)/np.sqrt(size/4)
        pairs.append({'seeds':[list(left),list(right)],'words_per_seed':size,'xor_bit_z':pair_z.tolist(),
                      'max_abs_z':float(np.max(np.abs(pair_z)))})
    flags=[]
    for r in results:
        if r['max_abs_frequency_z']>6 or r['max_abs_serial_z']>6 or r['duplicate_outputs']:
            flags.append({'seed':r['seed'],'reason':'frequency/serial |z| > 6 or duplicate output'})
    if np.max(np.abs(avalanche_z))>6: flags.append({'reason':'seed avalanche cell |z| > 6'})
    for r in pairs:
        if r['max_abs_z']>6: flags.append({'reason':'nearby-seed XOR bit |z| > 6','seeds':r['seeds']})
    report={'numpy_version':np.__version__,'classification':'exploratory diagnostics; no security/fairness conclusion',
        'z_note':'Normal-approximation standardized deviations; dependent and multiple comparisons, not calibrated family p-values.',
        'main_seed_cases':results,'seed_avalanche':{'base_recipe':'(i, (i*i*i) XOR UINT64_MAX), i=0..255',
         'bases':256,'input_bits':128,'outputs_per_seed':1,'counts_by_input_bit_output_bit':avalanche.tolist(),
         'max_abs_cell_z':float(np.max(np.abs(avalanche_z))),
         'mean_changed_output_bits':float(changed.sum()/32768)},'nearby_seed_pairs':pairs,
        'screening_flags':flags,
        'byte_note':'Eight byte-position chi-square statistics per seed, df=255; values retained without converting to tail probabilities.'}
    a.out.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'main_samples':len(seeds)*n,'seed_cases':len(seeds),
        'max_abs_bit_frequency_z':max(r['max_abs_frequency_z'] for r in results),
        'max_abs_serial_z':max(r['max_abs_serial_z'] for r in results),
        'avalanche_max_abs_z':report['seed_avalanche']['max_abs_cell_z'],
        'avalanche_mean_changed_bits':report['seed_avalanche']['mean_changed_output_bits'],
        'flags':flags}))


if __name__=='__main__': main()
