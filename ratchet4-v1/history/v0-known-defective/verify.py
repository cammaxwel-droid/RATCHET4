#!/usr/bin/env python3
# SPDX-License-Identifier: 0BSD
"""Independent arbitrary-precision V0 reference; checks a C++ CSV trace."""
import csv
import json
import sys

MASK = (1 << 64) - 1
MIDDLE = ((1 << 34) - 1) << 15  # Inclusive, zero-based LSB positions 15..48.


def reverse_bits(x):
    return int(f"{x & MASK:064b}"[::-1], 2)


def step(t, a, b):
    t = (t + 1) & MASK
    for j in (1, 2, 3):
        a = ((2 * b + 1) * a + reverse_bits(b * b + j * t)) & MASK
        b = ((2 * a + 1) * b + reverse_bits(a * a + (2 * j + 1) * t)) & MASK
    return t, a, b, a ^ reverse_bits(b)


def main(path):
    results = []
    current_seed = None
    compared = 0
    with open(path, newline="", encoding="utf-8") as source:
        for row in csv.DictReader(source):
            seed = int(row["seed0"], 16), int(row["seed1"], 16)
            if seed != current_seed:
                current_seed = seed
                t, a, b = 0, *seed
                record = {"seed": [f"0x{x:016x}" for x in seed], "calls": 0,
                          "first_outputs": [], "middle_nonzero_count": 0,
                          "first_middle_nonzero_call": None, "or_outputs": 0,
                          "ones_per_bit": [0] * 64}
                results.append(record)
            t, a, b, output = step(t, a, b)
            actual = tuple(int(row[k], 16) for k in ("t", "a", "b", "output"))
            expected = t, a, b, output
            if actual != expected or int(row["call"]) != record["calls"] + 1:
                raise RuntimeError(f"C++ / Python mismatch: {row!r}, expected {expected!r}")
            compared += 1
            record["calls"] += 1
            if len(record["first_outputs"]) < 8:
                record["first_outputs"].append(f"0x{output:016x}")
            record["or_outputs"] |= output
            for bit in range(64):
                record["ones_per_bit"][bit] += (output >> bit) & 1
            if output & MIDDLE:
                record["middle_nonzero_count"] += 1
                if record["first_middle_nonzero_call"] is None:
                    record["first_middle_nonzero_call"] = record["calls"]
    if len(results) != 10 or any(r["calls"] != 4096 for r in results):
        raise RuntimeError("Incomplete trace: expected ten seeds, 4096 calls each")
    for record in results:
        record["or_outputs"] = f"0x{record['or_outputs']:016x}"
        record["always_zero_bits"] = [i for i, n in enumerate(record["ones_per_bit"]) if n == 0]
        record["always_one_bits"] = [i for i, n in enumerate(record["ones_per_bit"]) if n == record["calls"]]
    zero = results[0]
    first_ok = zero["first_outputs"][0] == "0x8000000000000002"
    middle_ok = zero["middle_nonzero_count"] == 0
    print(json.dumps({"status": "EXECUTED", "cpp_python_matching_calls": compared,
                      "zero_seed_expected_first_output_confirmed": first_ok,
                      "zero_seed_middle_zero_for_4096_calls_confirmed": middle_ok,
                      "middle_mask": f"0x{MIDDLE:016x}", "seeds": results}, indent=2))
    if not first_ok or not middle_ok:
        raise SystemExit("Handoff defect claim was NOT confirmed")


if __name__ == "__main__":
    main(sys.argv[1])
