#!/usr/bin/env bash
# SPDX-License-Identifier: 0BSD
# Third-party test suite stays outside this project's engine and source tree.
set -euo pipefail
test_root="${1:-${TMPDIR:-/tmp}/ratchet4-practrand-0.96}"
mkdir -p "$test_root"
test_root="$(cd -- "$test_root" && pwd)"
curl --fail --location --retry 2 https://downloads.sourceforge.net/project/pracrand/PractRand_0.96.zip -o "$test_root/PractRand_0.96.zip"
python3 -B - "$test_root" <<'PY'
import hashlib,sys,zipfile
from pathlib import Path
root=Path(sys.argv[1]);archive=root/'PractRand_0.96.zip'
expected='e4caf7fda98b2c597bbda3b576753cf5a0f6047aab837c82be370ab798a672e1'
if hashlib.sha256(archive.read_bytes()).hexdigest()!=expected:
    raise SystemExit('PractRand archive hash mismatch; refusing extraction')
with zipfile.ZipFile(archive) as z:
    for item in z.infolist():
        if not (root/item.filename).resolve().is_relative_to(root):
            raise SystemExit('Unsafe archive path')
    z.extractall(root)
PY
cd "$test_root/PractRand"
g++ -std=c++17 -c src/*.cpp src/RNGs/*.cpp src/RNGs/other/*.cpp -O3 -Iinclude -pthread
ar rcs PractRand.a ./*.o
g++ -std=c++17 -o RNG_test tools/RNG_test.cpp PractRand.a -O3 -Iinclude -Itools -pthread
./RNG_test --self_test
printf 'Built external suite: %s/PractRand/RNG_test\n' "$test_root"
