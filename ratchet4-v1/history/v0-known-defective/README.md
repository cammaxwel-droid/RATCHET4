# V0 — known defective

Research reproduction only. Do not use this generator for gameplay.

## Preserved specification

All arithmetic is unsigned modulo 2^64. R reverses all 64 bits. Initialize
(t,a,b) = (0,seed0,seed1). For each call:

1. Increment t.
2. For j = 1,2,3, update a = (2b+1)a + R(b*b+j*t), then
   b = (2a+1)b + R(a*a+(2j+1)t). The second update uses the new a.
3. Return a XOR R(b).

`v0_reproduce.cpp` implements this specification directly using uint64_t.
`verify.py` independently uses arbitrary-precision arithmetic, explicit masks,
and string-based bit reversal. It compares every state word and output.

## Executed observations — 2026-11-01

GCC 12.2.0 compiled the source as C++17 with warnings treated as errors.
The program ran for ten specified seeds, 4,096 calls per seed.
All **40,960** calls matched the independent Python 3.12.12 implementation.

For seed (0,0):

- First output: **0x8000000000000002**, as reported in the handoff.
- Output bits **15 through 48 inclusive**, counting the least significant bit
  as bit zero, were zero on every one of the 4,096 calls.
- The tested mask was `0x0001ffffffff8000`.
- Bit 49 was also always zero in this finite run; the proof below does not
  assert that additional bit stays zero throughout its longer interval.

Seeds (2^63,0) and (0,2^63) had the same all-zero middle-bit defect for the
tested 4,096 calls. Their first outputs were respectively
`0x0000000000000002` and `0x8000000000000003`.

Other tested seeds: (0,1), (1,0), (1,1), (2,0), (0,2),
(2^64-1,2^64-1), and (0xaaaaaaaaaaaaaaaa,0x5555555555555555).
None had a permanently zero bit over its tested sample; that observation is
not evidence of their overall suitability.

A separate undefined-behavior-sanitized build ran without diagnostics and
produced a byte-identical full trace. No external statistical suite or
performance benchmark was run in this phase.

## Mathematical proof — distinct from the executed sample

Consider any seed whose two words are multiples of 2^49. There are 2^15
choices per word, so this family contains **2^30 seed pairs**.

Suppose a and b are multiples of 2^49. Then a*a, b*b, and 2ab vanish modulo
2^64. Consequently the ostensibly nonlinear updates reduce to

    a <- a + R(j*t)
    b <- b + R((2*j+1)*t)

As long as 7t < 2^15, all the arguments to R are below 2^15. Their reversed
words are multiples of 2^49, preserving the assumption under every update.
Induction therefore applies throughout calls 1 through
floor((2^15-1)/7) = **4,681**.

Throughout that interval a has nonzero bits only in positions 49..63 and
R(b) only in positions 0..14. Thus their XOR has zeros in positions 15..48.
This proves the reported defect for the entire seed family, over an interval
longer than the executed 4,096-call sample. Calls 4,097..4,681 were not executed
as part of the recorded run; the assertion about those calls is mathematical.

For seed (0,0), call 1 gives a = R(1)+R(2)+R(3) = 0x8000000000000000 and
b = R(3)+R(5)+R(7) = 0x4000000000000000, modulo 2^64. Hence the first output
is 0x8000000000000002. This independently derives the observed first value.

The counter also prevents a full state from repeating within fewer than
2^64 calls. That fact plainly does not rescue the output quality here.
Rejecting zero alone, changing the bounded mapper, or excluding tested weak
seeds is not a repair. No such workaround is supplied.
