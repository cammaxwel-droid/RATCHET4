# Ratchet-4 V1

A runnable, experimental C++17 PRNG prototype with a tiny table-selection demo.
The implementation follows the approved design. Source and project documents
are reusable under [0BSD](LICENSE).

## Run on Windows

Extract the complete ZIP and double-click **START_DEMO.cmd** (or launch
`bin/windows-x64/ratchet4.exe` directly). No compiler, Python, or separate C++ runtime download is
needed for the supplied executable.

- Press **Enter** to select ten entries from the demo table.
- Type `draw 1` to make one selection.
- Type `seed 123 456` to start a different deterministic sequence.
- Type `q` to quit.

The starting seed is `(0,0)`. The same seeds and commands replay the same
sequence. The table contains repeated labels; each entry is a separate index.
Selection does not merge items, calculate returns, or alter payouts.

The Windows x64 executable was cross-compiled with MinGW GCC and executed
under Wine on Linux. **Native Windows 11 execution and the MSVC build script
have not been tested.** Linux x64 binaries are also included under
`bin/linux-x64`.

## Status and evidence

**Statistical review is unresolved:** PractRand reported suspicious results,
including "very suspicious" intermediate results for seed `(2^63,0)`.
Later checkpoints do not erase those observations. V1 has not been accepted
as a reliable game RNG.

This is a research/demo prototype. Originality is proposed, not guaranteed.
It is not a cryptographic RNG, a fairness certification, or an approved
real-money engine. Exact full-state and output periods are unknown.

See [the results report](docs/RESULTS.md) for executed correctness checks,
statistical diagnostics, external-suite warnings, measured performance, and
limitations. The raw reports are included in `evidence/`.

The previous V0 is preserved as [known defective](history/v0-known-defective/README.md).
It is excluded from the build, library, and demo. No existing RNG library or
established generator supplies the V1 engine. PractRand is an external testing
tool only and is not linked into the delivered application.

## Command-line use

From `bin/windows-x64` in Command Prompt, or substitute the Linux binary path:

```text
ratchet4.exe demo 16 0 0
ratchet4.exe raw 8 123 456
ratchet4.exe bounded 20 123 456 37
ratchet4.exe --help
```

The arguments are count, seed0, seed1, then bound where applicable. Decimal
and `0x` hexadecimal integers are accepted; negative, malformed, and oversized
values are rejected. Text output is limited to one million rows per command.

For binary research data, `stream BYTES SEED0 SEED1 MODE` writes explicitly
little-endian words. Modes are `raw`, `low`, `high`, `reverse`, and `nearby`.
`low` and `high` emit four-byte words; other modes emit eight-byte words.
The byte count must be a multiple of that width. `nearby` outputs the first
draw from successive seed0 values to diagnose initialization; it is not the
normal evolving-state selection path. Avoid displaying binary output in a
terminal; pipe it to a tester or redirect it to a file. On Windows, use
Command Prompt for binary redirection.

## Use the header

```cpp
#include "ratchet4.hpp"

ratboy::Ratchet4 rng{123, 456}; // Seed once.
std::uint64_t raw = rng.next();
std::uint64_t index = rng.bounded(37); // 0..36
```

All 128-bit seed pairs, including zero, are accepted. A one-word constructor
uses seed1=0. `bounded(0)` and negative signed bounds throw
`std::invalid_argument` without changing state. Floating-point and Boolean
bounds are rejected at compile time. `bounded(1)` returns zero without a
draw. Other bounded calls can consume multiple raw draws. Maximum supported
bound is `UINT64_MAX`; `next()` covers the full raw 64-bit range.

An instance holds five 64-bit words, has no allocation, and uses no global
state. Keep each instance on one thread or synchronize access. Separate
seeds do not establish independent or nonoverlapping streams.
`state()` and `from_state()` support exact replay; treat state disclosure as
full disclosure of future and past behavior, not as a security boundary.

## Build and test

Linux prerequisites: C++17 compiler, Make, Python 3.9 or newer. From the
project folder, one command builds and runs the core tests:

```sh
bash build_test.sh
```

Build files go to `/tmp/ratchet4-v1-build` by default. Override with
`RATCHET4_BUILD_DIR=/your/path bash build_test.sh`. Core tests require no
NumPy or external RNG library.

On Windows, from an **x64 Native Tools Command Prompt for Visual Studio**
with the Python 3 launcher installed:

```bat
build_test.cmd
```

This MSVC route is supplied but unexecuted here. The prebuilt Windows binary
uses the tested MinGW cross-compilation route: `make windows` on Linux with
`x86_64-w64-mingw32-g++` installed. `test_engine.exe` is also included so the
C++ test suite can be run without compiling it.

Optional deeper checks (already run for this delivery):

```sh
make diagnostics  # additionally needs NumPy
make bench
```

For the external suite, see [reproduction commands](docs/REPRODUCING.md).
The suite is kept separate from the engine, and its own license is recorded
under `docs/third-party/`.

The supplied Windows binaries also contain compiler runtime components;
their upstream notices are retained under `docs/third-party/`. The project's
own engine, tests, and demo source use 0BSD.

## Design and research history

- [Mathematical design](docs/DESIGN.md): state, recurrence, constants,
  initialization, output mapping, bounded mapping, and limited proofs.
- [Approved proposal](docs/APPROVED_PROPOSAL.md): frozen historical rationale,
  prior-work comparisons, and planned tests.
- [Reference vectors](tests/vectors.json): ten seed pairs with warm-up states
  and sixteen raw outputs each, generated by the independent Python model.
- [Known-defective V0](history/v0-known-defective/README.md): reproduced
  defect and proof covering a family of 2^30 seeds.

Future game-return analysis must examine the tables, merges, and payouts
separately. This project contains no jackpot balancing, payout correction,
seed filtering, or complete game.
