# Strap 1.0 — executed results, 2026-11-01

## Correctness and platform checks

| Check | Actual outcome |
|---|---|
| Native C++17 contract tests | PASS: 1,351,009 assertions; 136 seed cases |
| CMake one-command build/test | PASS; GCC 12.2.0, CMake 3.31.6 |
| Address/undefined-behavior sanitizer run | PASS; no diagnostics |
| Original dependency removed | Compiler rejected missing `ratchet4.hpp`, as required |
| Browser/native comparison | PASS: 52,224 pairs / 104,448 individual outputs; 136 seeds |
| Frozen Strap references | PASS: 160 raw outputs, 10 seed cases |
| In-page tests | PASS: 4,480 assertions |
| Browser interaction checks | PASS: 29; no JavaScript errors or external network requests |
| Runtime | Emscripten 3.1.6; Node 22.23.3; Chromium 156.0.8078.4; Playwright 1.64.1 |

Browser tests used a downloaded-file-style `file:` URL on Linux. Windows 11, native Edge, Windows Smart App Control policy, and a Windows Strap executable were not tested. No Windows security setting is changed. Native C++ source, WebAssembly output, and standalone HTML are supplied; a new Windows executable is not part of this package.

Covered seeds include zero, nearby values, maximum values, and each one-bit position in either 64-bit seed word. Bounds include 1, 2, 3, 8, 37, 2^32+1, 2^63+1, and 2^64−1. The rejection-heavy bound exercises different raw-word consumption. Mixed schedules, counter wrap, state restoration, zero/negative bounds, and bool/floating-point exclusion are covered. These cases do not exhaust the seed or state spaces.

Zero-seed first raw pair: Ratchet `0x6a0d307c7b370277`, Strap `0x95f2cf8384c8fd88`. First table-index pairs: `(7,0)`, `(0,7)`, `(2,5)`.

## Descriptive diagnostics

Eight seed cases, each with 65,536 raw pairs and a separately reset 65,536 bounded pairs at bound 37: **524,288 raw pairs (4 MiB of source words)** and **524,288 bounded pairs**. At all 64 bit positions, original and mirrored one-counts sum to the sample size. Every bounded histogram is exactly reflected. Mirror invariant checks passed.

Across those samples, the largest absolute single-bit standardized deviation from half ones was **3.039062500**. Bound-37 chi-square statistics (36 degrees of freedom) ranged from **27.167816** to **49.584839**. These are descriptive numbers, not an acceptance test or an adjusted significance claim. Full counts for each seed are in `evidence/diagnostics.json`.

The UI's zero-seed inspection overlaps these streams, as do prefixes in other tests. Mirrored outputs are fully dependent, not additional independent random samples. No new PractRand, TestU01, or equivalent external suite run was performed on Strap. Original Ratchet results, including NS3 warnings and the later calibration investigation, are neither erased nor resolved by these checks. See the linked original reports in README.md.

## Native performance observation

Host CPU: AMD EPYC 9V74 80-Core Processor. Compiler: g++ (Debian 12.2.0-14+deb12u1) 12.2.0, `-O3`, shared Linux execution host. Five wall-clock trials of 1,000,000 calls per operation; initialization excluded. Medians and observed ranges are nanoseconds per draw:

| Operation | Median ns | Range ns |
|---|---:|---:|
| Ratchet raw | 17.9147 | 15.0857–19.2321 |
| Strap raw | 17.5162 | 15.9087–24.8179 |
| Paired raw | 16.3997 | 15.37–27.4739 |
| Strap bound 37 | 15.2934 | 14.5886–16.683 |
| Strap rejection-heavy bound | 37.9189 | 36.3489–62.5529 |

These measurements are noisy; their small differences do not demonstrate a speed improvement from mirroring. Paired raw timing includes consuming both returned values. The rejection-heavy bound is 2^63+1. The operation retains the original state evolution and adds only the relevant reflection; browser UI costs are not represented by this native benchmark. No performance guarantee is made for another machine.

## Commands and evidence

From this folder, with the stated tools installed:

```sh
python3 test.py
g++ -std=c++17 -O1 -g -fsanitize=address,undefined -fno-omit-frame-pointer -Iinclude tests/test_strap.cpp -o /tmp/test_strap_sanitized
/tmp/test_strap_sanitized
g++ -std=c++17 -O3 -Wall -Wextra -Wpedantic -Iinclude tests/benchmark.cpp -o /tmp/strap_benchmark
/tmp/strap_benchmark
python3 build.py --engine-out /tmp/strap-engine.js
node tests/compare_native.cjs /tmp/strap-engine.js /path/to/original/ratchet4
node tests/diagnostics.cjs /tmp/strap-engine.js
TEST_ARTIFACTS=/tmp/strap-browser-tests node tests/browser.cjs
```

The executed compiler commands, dependency-failure diagnostic, sanitizer output, CMake log, benchmark results, tool versions, and browser findings are under `evidence/`. Tests require appropriate installed tools; normal HTML use does not.

Original engine header SHA-256: `afc73d26c5c7b33448f6e11a33c081c3d719a70183b70801da3d5f32f81ef1ae`. HTML SHA-256: `07b7b0f8c8c8ed34ea139d4a4f0c732614a4dbcf9e56e92a728566b46441fce5`. `SHA256SUMS` covers the distribution files. Source engine bytes remain unchanged.

Passing these checks establishes the tested adapter behavior only. It does not establish security, fairness, exact period, freedom from weak seeds, or real-money suitability.
