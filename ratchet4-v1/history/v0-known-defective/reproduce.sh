#!/usr/bin/env bash
# SPDX-License-Identifier: 0BSD
set -euo pipefail
v0_source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
v0_work_dir="$(mktemp -d "${TMPDIR:-/tmp}/ratboy-v0.XXXXXXXX")"
g++ -std=c++17 -O2 -Wall -Wextra -Wpedantic -Wconversion -Werror \
    "$v0_source_dir/v0_reproduce.cpp" -o "$v0_work_dir/v0_reproduce"
"$v0_work_dir/v0_reproduce" > "$v0_work_dir/trace.csv"
python3 "$v0_source_dir/verify.py" "$v0_work_dir/trace.csv" > "$v0_work_dir/results.json"
g++ -std=c++17 -O1 -g -Wall -Wextra -Wpedantic -Wconversion -Werror \
    -fsanitize=undefined -fno-sanitize-recover=all \
    "$v0_source_dir/v0_reproduce.cpp" -o "$v0_work_dir/v0_ubsan"
"$v0_work_dir/v0_ubsan" > "$v0_work_dir/trace-ubsan.csv"
cmp "$v0_work_dir/trace.csv" "$v0_work_dir/trace-ubsan.csv"
sha256sum "$v0_work_dir/trace.csv" "$v0_work_dir/trace-ubsan.csv"
printf 'V0 defect reproduced; all 40960 reference comparisons matched.\nResults: %s/results.json\n' "$v0_work_dir"
