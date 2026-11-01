#!/usr/bin/env bash
# SPDX-License-Identifier: 0BSD
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
make -C "$project_dir" BUILD="${RATCHET4_BUILD_DIR:-${TMPDIR:-/tmp}/ratchet4-v1-build}" test
