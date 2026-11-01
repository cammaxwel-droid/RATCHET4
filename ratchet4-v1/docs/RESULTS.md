# Executed results — Ratchet-4 V1

Date: 2026-11-01 UTC. **Runnable research prototype; statistical acceptance unresolved.**
The approved engine was implemented without changing its recurrence, constants,
warm-up count, output mapping, or seed population. No seeds were filtered.

## What works

- Native Linux compilation and execution, with GCC 12.2.0 and C++17.
- Windows x64 cross-compilation using MinGW GCC 12-posix, with static compiler
  runtimes. Imports are KERNEL32.dll and msvcrt.dll.
- **1,001,379 C++ checks passed**, including reproducibility, reference vectors,
  invalid bounds without state consumption, rejection boundaries, exhaustive
  eight-bit mapper preimage counts, bound limits, counter wrap, state inversion,
  and demonstrated predictability after state disclosure.
- The same C++ test suite passed with AddressSanitizer and UBSan and emitted no
  diagnostic. It also passed in the Windows executable under Wine 8.0.
- **16,704 output comparisons** with an independently written Python integer
  model passed across 266 seed cases and eight bound choices. All five binary
  stream formats, eleven invalid CLI cases, 64 table-selection reference
  checks, and the interactive demo passed.
- In the first 4,096 outputs of each of ten boundary/weak-seed regression cases,
  every bit took both values. That directly checks V0's startup symptom in the
  tested V1 cases; it is not a proof about every possible seed.
- Additional Windows/Wine checks matched 768 reference words and 65,536 bytes
  in each of five stream formats against Linux, checked three invalid bounds,
  and exercised the interactive demo. The root Windows launcher also ran.

**Not executed:** native Windows 11 testing or the supplied MSVC build route.
Wine execution is explicitly not native Windows validation.

## Internal statistical diagnostics

The main screen examined **4,194,304 raw words**: 262,144 words for each of
16 documented seeds. It measured all 64 bit frequencies, bit-change behavior
at lags 1, 8, and 64, and eight byte-position chi-square statistics per seed.
No duplicate 64-bit outputs were observed within any of those per-seed samples.
These finite observations do not prove uniformity or independence.

- Largest absolute bit-frequency standardized deviation: 3.542969.
- Largest absolute serial-change deviation: 3.896492.
- Seed avalanche: 256 deterministic base seeds, all 128 input bits, and all
  64 output bits; **32,768 one-bit perturbations**. Average changed output
  bits: 31.995605; largest
  cell deviation: 4.625000.
- Eight nearby-seed pairs were compared for 65,536 words per seed.
- Corrected diagnostic screening flags: 0.

The deviations are normal-approximation diagnostics with dependent and
multiple comparisons, not calibrated family-wide probabilities. Byte
chi-square statistics are retained without claiming tail probabilities.
Internal screens do not overrule external warnings.

## External testing: PractRand 0.96

Expanded test battery with extra folding (`-te 1 -tf 2`), explicit producer
seeds and byte ordering. The suite's built-in self-test passed. Each completed
run reached its requested endpoint with zero producer/tester exit statuses.
Across completed runs, 4,865,392,640 bytes
(4.53125 GiB) were processed,
including projections and replayed prefixes. This is **not** that much
independent source data. The aborted extension is excluded from that total.

| Case | Bytes tested | Strongest reported classification anywhere in run | Endpoint |
|---|---:|---|---|
| [zero-raw](../evidence/practrand/zero-raw.txt) | 1,073,741,824 | unusual | no anomalies reported |
| [near-raw](../evidence/practrand/near-raw.txt) | 268,435,456 | mildly suspicious | no anomalies reported |
| [max-raw](../evidence/practrand/max-raw.txt) | 268,435,456 | mildly suspicious | warnings reported |
| [sparse-raw](../evidence/practrand/sparse-raw.txt) | 268,435,456 | very suspicious | no anomalies reported |
| [zero-low](../evidence/practrand/zero-low.txt) | 268,435,456 | none reported | no anomalies reported |
| [zero-high](../evidence/practrand/zero-high.txt) | 268,435,456 | none reported | no anomalies reported |
| [zero-reverse](../evidence/practrand/zero-reverse.txt) | 268,435,456 | very suspicious | no anomalies reported |
| [nearby-seeds](../evidence/practrand/nearby-seeds.txt) | 33,554,432 | none reported | no anomalies reported |
| [max-raw-followup](../evidence/practrand-followup/max-raw-followup.txt) | 1,073,741,824 | mildly suspicious | no anomalies reported |
| [sparse-raw-followup](../evidence/practrand-followup/sparse-raw-followup.txt) | 1,073,741,824 | none reported | no anomalies reported |

The most concerning initial result was seed `(0x8000000000000000,0)`:
`[Low1/16]NS3[5:pd:both]` reported approximately p=9.9e-10, classified
**very suspicious**, at both 32 MiB and 64 MiB. Another low-bit NS3 subtest
reported very suspicious values around 6.2e-9 and 1.1e-8. That initial run's
256 MiB checkpoint reported no anomalies. The maximum seed pair also had
mildly suspicious NS3 results, including at 256 MiB. Seed `(1,0)` had an
earlier mildly suspicious NS3 result at 2 MiB.

The reversed zero-seed stream also produced a very suspicious NS3 result
(approximately p=1.4e-9) at 16 MiB. Its 256 MiB endpoint reported none.

The sequential 1 GiB follow-ups and every original warning are retained.
A later checkpoint without an anomaly does not erase earlier evidence:
subtests and parameters can change with length. The cause of these warnings
has not been established. They must not be dismissed as chance, nor do
these observations by themselves constitute a mathematical proof of a flaw.
**V1 is not accepted as a reliable game RNG.** No claim of an external-suite
clean pass, security, fairness, production suitability, or real-money readiness
is made. The demo remains a way to inspect the candidate's behavior.

## Cycle and predictability investigation

The full-state transition is reversible. The counter proves that its state
cycles are multiples of 2^64; it does not prove an exact period or a minimum
output period. The output map is balanced over uniformly sampled full states,
not proven balanced on the seeded trajectories.

Exhaustive toy models enumerated all 1,024 two-bit-word states and all 32,768
three-bit-word states. Both were permutations. The two-bit model had eight
cycles ranging from 4 to 436 transitions; the three-bit model had eight cycles
ranging from 112 to 11,864. Constants were truncated and rotations reduced
modulo width, so these results must not be extrapolated to a 64-bit period.

Known seeds reproduce outputs. Full-state cloning predicted future outputs
in executed tests, and backward steps recovered prior states, including
across counter wrap. No cryptographic security or recovery-work lower bound
has been established. Related-seed stream independence remains unproved.

## Measured performance

Optimized Linux build on an AMD EPYC 9V74 virtual machine, with three visible
logical CPUs, a cgroup quota of two CPUs, and a 4 GiB container memory limit.
GCC flags: `-std=c++17 -O3 -Wall -Wextra -Wpedantic -Wconversion -Werror`.
No `-march=native`, CPU pinning, or clock-frequency control was used. Five
repetitions per mode, a warm-up, and a consumed checksum prevent discarded
work. Benchmarking occurred after the initial matrix, before the sequential
follow-ups, with no PractRand job running. Numbers include loop/checksum cost
and are host measurements, not Windows or cross-machine promises. The two
bounded benchmarks use compile-time constant bounds, permitting compiler
optimization; arbitrary runtime bounds can have different costs.

| Mode | Operations per repeat | Median ns/op | Min–max ns/op | Median million ops/s |
|---|---:|---:|---:|---:|
| raw | 5,000,000 | 15.30 | 14.90–15.81 | 65.35 |
| bounded37 | 5,000,000 | 15.65 | 15.18–16.61 | 63.89 |
| bounded_worst | 5,000,000 | 35.87 | 35.78–36.43 | 27.88 |
| seed_and_first | 312,500 | 236.88 | 234.55–241.58 | 4.22 |

`bounded_worst` uses 2^63+1, near the largest ideal-uniform rejection rate.
`seed_and_first` includes all 16 warm-up transitions and the first emitted
word. Logical state size is 40 bytes; there is no per-instance allocation.
Raw CSV timings and checksums are in `evidence/benchmark.csv`.

## Failures and limitations retained

1. The original NumPy avalanche script performed unsigned subtraction and
   emitted an impossible z value. The script was corrected and calibrated;
   the same samples were rerun. Original code and reports remain in
   `evidence/harness-history/`. The engine was unchanged.
2. An initial maximum-seed extension was killed before 1 GiB while three
   expanded tests overlapped. The tester exited with signal 9, its producer
   with SIGPIPE; cgroup OOM evidence is retained. Its last reported checkpoint
   was 512 MiB. The incomplete run is preserved in
   `evidence/practrand-followup-aborted/`, not counted as a completed test.
   Follow-ups were subsequently run sequentially.
3. PractRand compiled with upstream warnings; its self-test passed. No
   upstream source was patched. The build log and license are included.
4. Wine initialization reported a missing 32-bit rundll32 executable. The
   delivered programs are 64-bit, and their Wine checks passed. No native
   Windows result is claimed.
5. No exhaustive weak-seed search, exact-period proof, cryptanalysis,
   independent expert review, or game-return analysis was performed.

## Reproduction and preservation

[Reproduction commands](REPRODUCING.md), full source, automated tests, reference
vectors, raw results, and 0BSD licensing are supplied. Compiler-runtime and
external-suite notices remain separate. V0's original handoff specification,
reconstructed source, known-defective label, and executed evidence are
preserved under `history/`; V0 is not linked into the demo.

Engine header SHA-256: `afc73d26c5c7b33448f6e11a33c081c3d719a70183b70801da3d5f32f81ef1ae`.
