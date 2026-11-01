# Execution record

Date: 2026-11-01 UTC. Working directory: `/workspace`.

Environment: Linux x86-64, GCC 12.2.0 (Debian 12.2.0-14+deb12u1),
Python 3.12.12, GNU Make 4.3. CPU reported by the virtual machine:
AMD EPYC 9V74, three visible logical CPUs. No Windows execution occurred.
Clang, CMake, Ninja, PractRand's RNG_test, dieharder, and the queried
MinGW cross-compiler were not found on PATH. `rg` was also unavailable;
workspace inspection used `find` as a fallback.

Executed commands, after creating the output and temporary directories:

```sh
g++ -std=c++17 -O2 -Wall -Wextra -Wpedantic -Wconversion -Werror /workspace/outputs/ratboy-prng-research/history/v0-known-defective/v0_reproduce.cpp -o /workspace/artifact-work/v0-verification/v0_reproduce
/workspace/artifact-work/v0-verification/v0_reproduce > /workspace/artifact-work/v0-verification/trace.csv
python3 /workspace/outputs/ratboy-prng-research/history/v0-known-defective/verify.py /workspace/artifact-work/v0-verification/trace.csv > /workspace/outputs/ratboy-prng-research/evidence/v0-results.json
g++ -std=c++17 -O1 -g -Wall -Wextra -Wpedantic -Wconversion -Werror -fsanitize=undefined -fno-sanitize-recover=all /workspace/outputs/ratboy-prng-research/history/v0-known-defective/v0_reproduce.cpp -o /workspace/artifact-work/v0-verification/v0_ubsan
/workspace/artifact-work/v0-verification/v0_ubsan > /workspace/artifact-work/v0-verification/trace-ubsan.csv
cmp /workspace/artifact-work/v0-verification/trace.csv /workspace/artifact-work/v0-verification/trace-ubsan.csv
sha256sum /workspace/artifact-work/v0-verification/trace.csv /workspace/artifact-work/v0-verification/trace-ubsan.csv
```

Both builds and executions succeeded. No warning or UBSan diagnostic was
emitted. Both CSV traces have SHA-256:

`ea1d8ee1381d9f4be25e8f4a9f477b55373810628d5b379dfce73b35302ff047`

The trace contains 40,960 generated words (327,680 raw-output-equivalent
bytes), plus state and CSV formatting. It is an implementation comparison
and targeted defect investigation, not an external randomness test.
The JSON report is the retained evidence; traces and binaries are temporary
and reproducible. The replacement engine has no executed results.
