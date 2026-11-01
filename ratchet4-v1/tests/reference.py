#!/usr/bin/env python3
# SPDX-License-Identifier: 0BSD
"""Independent integer model of the approved mathematics; no RNG library."""
from math import isqrt

MASK = (1 << 64) - 1
K = [isqrt(p << 128) - (isqrt(p) << 64) for p in (67, 71, 73, 79, 83, 89, 97, 101)]


def rotate(v, amount):
    v &= MASK
    return ((v << amount) | (v >> (64-amount))) & MASK


def advance(state):
    c, x, y, z, w = state
    c = (c + 1) & MASK
    for j in range(8):
        f = rotate(y + K[j] + c, 17) ^ ((rotate(z + K[(j+3) % 8], 41)
            + (z + K[(j+5) % 8]) * (w | 1)) & MASK)
        x, y, z, w = y, z, w, x ^ f
    return (c, x, y, z, w), ((x + rotate(y, 23)) & MASK) ^ rotate(z+w, 47)


def retreat(state):
    c, x, y, z, w = state
    for j in reversed(range(8)):
        f = rotate(x + K[j] + c, 17) ^ ((rotate(y + K[(j+3) % 8], 41)
            + (y + K[(j+5) % 8]) * (z | 1)) & MASK)
        x, y, z, w = w ^ f, x, y, z
    return ((c-1) & MASK, x, y, z, w)


class Reference:
    def __init__(self, seed0=0, seed1=0):
        self.state = (0, seed0 ^ K[0], seed1 ^ K[1], (MASK ^ seed0) ^ K[2], (MASK ^ seed1) ^ K[3])
        for _ in range(16):
            self.next()

    def next(self):
        self.state, value = advance(self.state)
        return value

    def bounded(self, bound):
        if not isinstance(bound, int) or isinstance(bound, bool) or not 1 <= bound <= MASK:
            raise ValueError('invalid bound')
        if bound == 1:
            return 0
        threshold = (1 << 64) % bound
        while True:
            value = self.next()
            if value >= threshold:
                return value % bound
