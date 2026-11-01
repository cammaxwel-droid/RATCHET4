# Reproducing the investigation

This is a separate diagnostic addendum. The runnable game-table prototype remains in the neighboring `ratchet4-v1` directory and original ZIP.

Tested tools: Linux 6.18.57 x86_64, GCC 12.2.0, Python 3.12.12, NumPy (exact version in `evidence/analysis.json`), OpenSSL 3.0.17, and PractRand 0.96. Only one full expanded suite was run at a time. The focused panel ran sequentially. Full-suite execution should allow about 2 GiB RAM; the retained temporary panel inputs occupy 3.0625 GiB of disk.

PractRand was previously built from the official `PractRand_0.96.zip`:

`SHA256 e4caf7fda98b2c597bbda3b576753cf5a0f6047aab837c82be370ab798a672e1`.

The original prototype's `tools/build_practrand.sh` documents the pinned download/build procedure. No upstream source changes were used for the baseline adapter or full-suite control run.

## Commands executed in this workspace

```sh
python3 /workspace/outputs/ratchet4-v1-investigation/build_probe.py \
  --practrand /workspace/artifact-work/ratchet4-tools/practrand/PractRand \
  --build /workspace/artifact-work/ratchet4-investigation/normal
```

The initial panel adapter used the same direct compiler/link command represented by that script. Adding an inactive trace preprocessor section later did not change its CSV output; `evidence/normal-build.json` and `evidence/verification.json` retain verification details.

For a fresh replay, choose a new, nonexistent output directory. The runner refuses an existing directory to preserve earlier results:

```sh
python3 run_controls.py \
  --probe /workspace/artifact-work/ratchet4-investigation/normal/ns3_probe \
  --engine /workspace/outputs/ratchet4-v1/bin/linux-x64/ratchet4 \
  --work /tmp/ratchet4-control-inputs \
  --out /tmp/ratchet4-investigation-replay/control-panel
python3 analyze.py \
  --evidence /tmp/ratchet4-investigation-replay \
  --inputs /tmp/ratchet4-control-inputs
```

Every control encrypts exactly 64 MiB of zero bytes using this OpenSSL command, with a public 256-bit key equal to the control number and an all-zero 128-bit IV:

```text
openssl enc -aes-256-ctr -K KEY_AS_64_HEX_DIGITS -iv 00000000000000000000000000000000 -nosalt -nopad
```

The runner feeds zero bytes on stdin and saves stdout. These are deterministic external controls; no operating-system entropy or secret keys are required to reproduce them. Their command lines and resulting file hashes are in the manifest. OpenSSL does not participate in V1 initialization or draws.

Original full-suite command executed:

```sh
/workspace/artifact-work/ratchet4-tools/practrand/PractRand/RNG_test \
  stdin64 -seed 0 -tlmin 20 -tlmax 26 -tf 2 -te 1 \
  < /workspace/artifact-work/ratchet4-investigation/panel-inputs/aes-control-11.bin \
  > evidence/aes-control-11-full-suite.txt \
  2> evidence/aes-control-11-full-suite.stderr.txt
```

The tester's `-seed 0` is its own metadata/configuration, not the AES key or V1 seed. The original suite stops on the control's `FAIL` at 16 MiB although the requested limit is 64 MiB; exit status is 0. Do not interpret process success as a statistical pass. The focused adapter does not stop when a score is extreme and therefore reports all seven checkpoints.

## Count-only tracing

```sh
python3 build_probe.py \
  --practrand /workspace/artifact-work/ratchet4-tools/practrand/PractRand \
  --build /tmp/ratchet4-ns3-trace --trace
/tmp/ratchet4-ns3-trace/ns3_probe_trace INPUT.bin 26 > traced.csv 2> traced.txt
```

The script copies `tests_other.cpp` into the temporary build directory and inserts exactly one stderr print, immediately before the existing zero-count check. The print reports size index, threshold, retained core count, threshold-history count, and the two variance/count accumulators. The adapter adds a context line giving checkpoint and projection. The baseline upstream files are preserved. A separate traced object supplies the same test definitions at link time; scores are compared against the original library adapter, not treated as a substitute for the original suite.

The sparse seed, control 11, and reversed zero-seed traced CSVs each matched the corresponding original-adapter CSV byte for byte. `analyze.py` separately reconstructs the low-bit projections and candidate core selection with NumPy, without reading private upstream state.

The initial two-core assertion in that independent analysis correctly failed for the reversed case, which has three cores. The final analysis enumerates the actual three pairs and makes no one-pair-tail claim for their joint score. The underlying data and upstream results were unchanged.

## Preserved V1 hashes

```text
include/ratchet4.hpp
afc73d26c5c7b33448f6e11a33c081c3d719a70183b70801da3d5f32f81ef1ae

ratchet4-v1-prototype.zip
c9f0bca1c4da5452fe93aad13874079540459d54d2365cd2bf1b7303401e4849
```

This addendum contains the adapter/scripts/evidence, not a modified engine or installer. Recorded source/probe/input hashes support auditing. Timings are observations from this container, not performance promises.
