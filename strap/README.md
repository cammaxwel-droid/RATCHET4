# Strap — Ratchet's mirrored companion

**Open `Strap-Lab.html` in Edge or Chrome.** No installation, administrator mode, command launcher, or separate executable is needed. The original Ratchet engine is already included. The page runs offline and uses the actual C++17 implementation compiled to WebAssembly.

Strap is an output adapter around **unchanged Ratchet-4 V1**, not a newly invented independent generator. It flips each raw bit and reflects bounded indices. The paired interface gets both values from one source draw, with no payout adjustments.

## Try it

1. Leave both seeds at `0` and click **Draw 10**. The first three Ratchet indices are `7, 0, 2`; Strap shows `0, 7, 5`.
2. Click **Replay**, then **Draw 10**. The same pairs return.
3. Try **Custom bound** or **Raw 64-bit words**. Table pairs sum to 7; custom-bound pairs sum to `bound − 1`; corresponding raw bits are opposite.
4. Click **Run checks** for frozen references, mapping, replay, and input validation. **Inspect 65,536 pairs** shows descriptive bit counts using a separate instance. Neither action changes your live sequence.
5. **Export report** saves the seeds, current state, recent pairs, counts, and any checks you ran.

The table is the original eight-entry demo: Leaf, Twig, Stone, Leaf, Acorn, Twig, Crystal, Leaf. Indices select entries only. No merge rules, jackpot accounts, payout correction, or complete game are implemented.

## Ratchet first; Strap second

[Strap's custom license](LICENSE) expressly requires original Ratchet before using Strap, requires Strap to keep using it as its source engine, and requires distributions to include original Ratchet source and its license. Bundling satisfies the prerequisite: there is no payment, registration, or extra download. The standalone HTML embeds the required source and license notices.

This dependency condition applies to **new Strap code**. It does not change Ratchet's [0BSD license](licenses/Ratchet-0BSD.txt) or permissions on earlier releases. The required original header is included without changes and its hash is checked during both CMake and browser builds. Removing it causes compilation to fail.

Strap's terms are custom, not 0BSD or an OSI-approved license. [0BSD grants broad permission without a dependency condition](https://opensource.org/license/0bsd); the requested new condition is therefore expressed separately. The [Open Source Definition](https://opensource.org/osd) has its own licensing criteria; this project makes no claim that the custom terms meet them. The custom wording has not had legal review; enforceability is not established.

License scope: new Strap files use `LicenseRef-Ratchet-Required-1.0`; `include/ratchet4.hpp` and `tests/ratchet-vectors.json` retain 0BSD; files in `licenses/` retain their respective notices and terms. The same distinctions apply to embedded material in the HTML.

## What the mirror means

For raw output `r`, Strap returns `UINT64_MAX − r`. For a valid bound `B`, it first asks original Ratchet for `r = bounded(B)`, then returns `B − 1 − r`. It does not run rejection sampling on complemented raw values, which would break the intended call alignment.

The outputs are fully dependent. Inversion preserves a uniform distribution **if the original output is uniform**; it does not establish that premise or repair bias. A reflected table index is not a reflected payout. Under a uniform index assumption, reversing indices permutes a table's entries and leaves its average payout unchanged. Return and jackpot behavior still require separate analysis of tables, merges, stakes, and payouts. See [DESIGN.md](DESIGN.md).

## Executed checks

- **1,351,009 C++ assertions**, 136 seed cases; CMake build/test and address/undefined-behavior sanitizers passed.
- **52,224 paired draws** compared with the original native Ratchet CLI: 104,448 individual outputs, plus 160 frozen Strap reference outputs.
- **4,480 in-page assertions** and **29 browser interaction checks**, including replay, bounds, exact large integers, report export, and offline operation.
- Descriptive raw-bit and bounded-frequency diagnostics across **8 seed cases**; mirrored results are dependent observations, not extra independent samples.
- Native benchmark: five trials of one million draws per operation. Full timings and limitations are in [RESULTS.md](RESULTS.md).

Tests ran on Linux with GCC 12.2, Emscripten 3.1.6, Node 22.23.3, and Chromium 156. Windows 11 and Edge on Windows were not executed here. The HTML avoids invoking the unsigned native launcher; it does not alter Windows security settings.

These are implementation checks and limited diagnostics, not security, fairness, or production certification. No external randomness suite was rerun specifically on Strap. Ratchet's existing statistical warnings and calibration investigation remain relevant and are preserved in the [original results](https://github.com/cammaxwel-droid/RATCHET4/blob/main/ratchet4-v1/docs/RESULTS.md) and [investigation](https://github.com/cammaxwel-droid/RATCHET4/tree/main/investigation). V0 remains rejected and is not used. Real-money deployment is not approved.

## Source and development

Normal review only needs the HTML. For a native build and automated tests, install a C++17 compiler, CMake 3.16+, and Python 3, then run from this folder:

```sh
python3 test.py
```

On Windows, use `py test.py` with a working C++17 build toolchain and CMake on PATH. To retain build products instead of using a temporary test directory:

```sh
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
ctest --test-dir build -C Release --output-on-failure
```

The last example's `--test-dir` requires CMake/CTest 3.20+; with an older version, run `ctest -C Release --output-on-failure` from inside `build`. The targets are `strap_demo`, `test_strap`, and `strap_benchmark`. The demo prints ten index pairs. The header API is in `include/strap.hpp`:

```cpp
#include "strap.hpp"
ratboy::Strap rng{0, 0};              // two unsigned 64-bit seeds
const auto pair = rng.bounded_pair(8); // Ratchet 7, Strap 0
const auto index = rng.bounded(8);     // next draw: Strap 7
const auto word = rng.next();         // next raw mirrored word
```

All calls advance the same evolving source state, except `bounded(1)` which returns zero without consuming a word. For a matched pair, use a pair-returning method once; two successive calls are two draws.

To rebuild the browser page with Emscripten installed:

```sh
python3 build.py --engine-out /tmp/strap-engine.js
node tests/diagnostics.cjs /tmp/strap-engine.js
node tests/compare_native.cjs /tmp/strap-engine.js /path/to/original/ratchet4
```

The native comparison executable is the original CLI from the Ratchet review release. It is not necessary for normal use or `test.py`. Browser automation additionally needs Node, Playwright, and Chromium:

```sh
TEST_ARTIFACTS=/tmp/strap-browser-tests node tests/browser.cjs
```

Use an appropriate temporary path and environment-variable syntax on Windows. Frozen vectors, commands, tool versions, raw counts, and test outcomes are supplied under `tests/` and `evidence/`. Compiler/runtime notices are in `licenses/` and embedded in the HTML.
