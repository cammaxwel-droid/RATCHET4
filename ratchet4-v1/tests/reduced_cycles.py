#!/usr/bin/env python3
# SPDX-License-Identifier: 0BSD
"""Exhaustive toy-width cycles. These are NOT the 64-bit generator's periods."""
import json
from reference import K


def analyze(width):
    mask=(1<<width)-1
    def rot(v,n):
        v&=mask;n%=width
        return ((v<<n)|(v>>((width-n)%width)))&mask
    def decode(value):
        return tuple((value>>(width*i))&mask for i in range(5))
    def step(value):
        c,x,y,z,w=decode(value);c=(c+1)&mask
        for j in range(8):
            f=rot(y+(K[j]&mask)+c,17)^((rot(z+(K[(j+3)%8]&mask),41)+(z+(K[(j+5)%8]&mask))*(w|1))&mask)
            x,y,z,w=y,z,w,x^f
        return sum(v<<(width*i) for i,v in enumerate((c,x,y,z,w)))
    size=1<<(5*width)
    edges=[step(i) for i in range(size)]
    assert len(set(edges))==size,'toy map is not reversible'
    seen=bytearray(size);lengths=[]
    for start in range(size):
        if seen[start]:continue
        cursor=start;length=0
        while not seen[cursor]:
            seen[cursor]=1;length+=1;cursor=edges[cursor]
        assert cursor==start,'unexpected transient'
        assert length%(1<<width)==0,'counter-bound violation'
        lengths.append(length)
    histogram={str(length):lengths.count(length) for length in sorted(set(lengths))}
    return {'word_bits':width,'states_enumerated':size,'cycles':len(lengths),
            'minimum_cycle':min(lengths),'maximum_cycle':max(lengths),'cycle_length_histogram':histogram}


if __name__=='__main__':
    print(json.dumps({'warning':'Truncated constants and rotations reduced modulo word width; no extrapolation to 64-bit period.',
                      'results':[analyze(2),analyze(3)]},indent=2))
