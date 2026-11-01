# Reproducing the measurements

Run from the extracted project directory. Paths below assume the default
build directory. Full environment and compiler versions are in
`evidence/environment.json` and `evidence/cpu.txt`.

## Core implementation checks

```sh
bash build_test.sh
```

This builds with C++17, optimization, strict warnings, and warnings as errors.
It runs the C++ behavior tests, the independent Python model comparison,
and exhaustive two- and three-bit toy-model state enumeration.

Sanitizer command executed in this workspace (substitute your build path):

```sh
g++ -std=c++17 -O1 -g -Wall -Wextra -Wpedantic -Wconversion -Werror -fsanitize=address,undefined -fno-sanitize-recover=all -fno-omit-frame-pointer -Iinclude tests/test_engine.cpp -o /tmp/ratchet4-v1-build/test_sanitized
/tmp/ratchet4-v1-build/test_sanitized
```

## Internal diagnostics and performance

```sh
python3 -B tests/diagnostics.py /tmp/ratchet4-v1-build/ratchet4 /tmp/ratchet4-v1-build/seed_probe /tmp/ratchet4-diagnostics.json
/tmp/ratchet4-v1-build/benchmark 5000000
```

The diagnostic script needs NumPy. It reports all tested seeds, all bit
counts, serial-change deviations at lags 1/8/64, byte-position chi-square
values, a seed-avalanche matrix, and nearby-seed comparisons. Its standardized
deviations are exploratory normal approximations, not calibrated family-wide
p-values. A threshold of absolute z > 6 marks a screening flag; it is not
a universal acceptance criterion for a generator.

The benchmark runs five repetitions for raw output, bound 37, a bound near
the worst ideal rejection rate (2^63+1), and seed initialization plus the
first draw. Each repetition consumes a checksum; results include elapsed
seconds and nanoseconds per operation. Seeding uses 1/16 as many operations.

## PractRand 0.96

Download source and build it outside the project:

```sh
bash tools/build_practrand.sh /tmp/ratchet4-practrand-0.96
python3 -B tools/run_practrand.py /tmp/ratchet4-v1-build/ratchet4 /tmp/ratchet4-practrand-0.96/PractRand/RNG_test /tmp/ratchet4-external-results
```

The download script requires curl, Python 3.9+, GCC, and ar. It checks this
SHA-256 for the official `PractRand_0.96.zip` archive:

`e4caf7fda98b2c597bbda3b576753cf5a0f6047aab837c82be370ab798a672e1`

Source URL: <https://downloads.sourceforge.net/project/pracrand/PractRand_0.96.zip>.
The retained upstream compiler warnings are in
`evidence/practrand/build-log.txt`; its built-in self-test passed.
No upstream source changes were made. The engine never links this library.

The fixed matrix uses expanded tests and extra folding (`-te 1 -tf 2`):
1 GiB for zero/raw, 256 MiB each for nearby/raw, maximum/raw, high-bit/raw,
zero/low32, zero/high32, zero/reversed64, and 32 MiB of successive-seed first
outputs. Two cases run concurrently. Full exact commands and exit statuses
are in `evidence/practrand/summary.json`.

All byte units in these records are binary units. The suite's `-seed 0`
labels/configures the tester; the generator seeds are the arguments to the
producer, explicitly listed in the summary. The producer is deterministic.
The runner retains every test log, including intermediate warnings, and
checks that the requested endpoint was reached. Repeated projected streams
are not independent additional source data. A finite lack of reported
failure is not a security, fairness, or production certificate.

Warning-driven follow-ups replay the maximum and high-bit seed prefixes
through 1 GiB, reporting at 256 MiB, 512 MiB, and 1 GiB. They reuse earlier
prefixes and are not independent replication:

```sh
python3 -B tools/run_practrand.py /tmp/ratchet4-v1-build/ratchet4 /tmp/ratchet4-practrand-0.96/PractRand/RNG_test /tmp/ratchet4-followups --follow-up-both
```

Run this after the base matrix has finished. The combined follow-up option
runs one case at a time. An earlier attempt overlapping three expanded
testers exceeded this container's 4 GiB memory limit; the incomplete log and
cgroup evidence are retained in `evidence/practrand-followup-aborted/`.
The runner refuses a nonempty results directory to preserve earlier evidence.

## Windows executable under Wine

The actual run used Wine 8.0 and a dedicated prefix outside the project:

```sh
python3 -B tools/test_windows_wine.py /usr/lib/wine/wine64 bin/windows-x64/ratchet4.exe bin/windows-x64/test_engine.exe /tmp/ratchet4-v1-build/ratchet4 /tmp/ratchet4-wine
```

This checks the C++ suite, reference outputs, binary streams, rejected bounds,
and the interactive demo. It does not substitute for a native Windows 11 test.
Initial Wine setup emitted a missing 32-bit rundll32 warning; the delivered
executables are 64-bit. The initialization message is retained separately.

## Diagnostic harness correction

The initial NumPy avalanche diagnostic subtracted 128 from an unsigned
64-bit count before converting to floating point. Counts below 128 wrapped
and produced an impossible deviation of about 2.3e18. This was a test-harness
bug, not an engine change. The corrected calculation casts before subtracting
and checks calibration counts 0, 128, 256 against z = -16, 0, 16.

The original script and reports remain in `evidence/harness-history/`.
The same seeds, sample sizes, algorithm, and thresholds were rerun; the
current report is `evidence/diagnostics.json`. No failing seeds were removed.
