# P-RNG browser review lab

**Open `P-RNG-Lab.html` normally in Edge or Chrome.** It is a complete offline interface: no installation, local server, command file, administrator mode, or compiler is required. Everything needed to run it is inside the HTML file. Downloading just that file is sufficient.

This runs the **unchanged, approved C++17 Ratchet-4 V1 engine**, compiled to WebAssembly. It is not a JavaScript replacement RNG. The embedded JavaScript controls the interface and validates inputs; it does not generate the random words.

## Try it

1. Click **Draw 1**, **Draw 10**, or **Draw 1,000**. The default table has the same eight entries as the original console demo. Its first three zero-seed selections are index 7 (Leaf), 0 (Leaf), and 2 (Stone).
2. Click **Replay from start** and repeat the same calls to reproduce the sequence. Editing seed fields does not take effect until **Apply seeds & reset** succeeds.
3. Choose **Bounded integer** to enter an exclusive upper limit, or **Raw 64-bit word** to inspect the unsigned output in hexadecimal. Invalid input displays a message without advancing the generator.
4. Click **Run checks**. Expected result: **5,485 assertions passed**, covering frozen reference vectors, replay/continuation, bounded mapping, invalid inputs, and state preservation.
5. **Sample 64 output bits** produces a descriptive 65,536-word sample from a separate instance using the active seeds. It does not disturb the live sequence or produce a randomness certification.
6. **Save review report** downloads a JSON record of the active seeds, recent outputs, current state, counts, checks, and sample results. State disclosure makes future outputs predictable; this is a review feature, not a security interface.

The history retains the last 40 outputs. Histogram counts cover table selections only. Selecting a different mode does not reseed the engine. A bound of one returns zero without consuming a raw word. Session raw-word counts exclude the 16 initialization transitions. Reference-vector checks use their fixed seeds rather than treating the active seed as a statistical test population.

## What was verified

- The included C++ header is byte-identical to the approved engine: SHA-256 `afc73d26c5c7b33448f6e11a33c081c3d719a70183b70801da3d5f32f81ef1ae`.
- **52,224 comparisons against the original native C++ executable** passed: 136 seed cases, raw output, and eight bounds including the rejection-heavy bound `2^63+1` and maximum uint64.
- The browser's **5,485 correctness assertions** passed both in Node and Chromium.
- **24 automated browser assertions** passed, including default output, exact maximum seeds, invalid-input state preservation, replay, table counts, raw mode, non-mutating checks/sampling, report export, and desktop/mobile fit.
- The HTML was tested directly from a `file:` URL, with **zero external HTTP requests and zero browser runtime errors**. Desktop and mobile screenshots were inspected.

Test environment: Linux, Node 22.23.3, Emscripten 3.1.6, and Playwright/Chromium versions recorded in `evidence/browser-tests.json`. Native Windows 11, Windows Smart App Control behaviour, and Edge on Windows have not been executed here. This browser review has not added new independent statistical-suite results to the earlier investigation.

This remains an **experimental research/demo generator**. Correctness checks do not establish security, fairness, unbiased seeded paths, originality, exact period, or production suitability. The earlier statistical evidence remains unresolved; the NS3 investigation is available in the original review release. There is no merge, payout, jackpot, seed filtering, or outcome correction logic.

## About the blocked native launcher

The original native executable is unsigned. Microsoft's [Smart App Control guidance](https://support.microsoft.com/en-us/windows/security/threat-malware-protection/smart-app-control-frequently-asked-questions) explains that untrusted/unsigned software can be blocked. This HTML version runs inside the browser and does not launch that executable or change Windows security settings.

The original launcher uses a path relative to its own location. Its expected target is `ratchet4-v1/bin/windows-x64/ratchet4.exe`. A missing-path message is consistent with an incomplete extraction, a moved launcher, or an inaccessible executable; the exact cause on your PC has not been established. Administrator mode does not supply missing files or establish publisher trust.

An optional replacement `native-launcher/START_DEMO.cmd` adds a clear missing-file message. It belongs in the original `ratchet4-v1` folder, next to its `bin` directory. It is included for troubleshooting, **not needed for this UI**, and does not sign or unblock the native program. Its updated Windows-specific error paths have not been executed on Windows here.

## Rebuilding and testing

Prerequisites for rebuilding only: Python 3 and Emscripten with C++17 support.

```sh
python3 build.py
```

The script compiles the bridge using the unmodified header, embeds the WebAssembly module and reference vectors, and writes the standalone HTML. Compiler flags and hashes are recorded in `evidence/build.json`. All intermediate compiler files use a temporary directory outside this deliverable.

For the native comparison, compile a bridge JS file with the flags shown in `evidence/build.json`, then:

```sh
node tests/compare_native.cjs /path/to/engine.js /path/to/native/ratchet4
```

For browser tests, install Playwright and its Chromium browser in your test environment, then run with Playwright on Node's module path:

```sh
TEST_ARTIFACTS=/tmp/prng-ui-browser-tests node tests/browser.cjs
```

This container used `NODE_PATH=/workspace/artifact-work/prng-ui-tools/node_modules` for the external Playwright installation. Browser screenshots and downloaded test reports go to `TEST_ARTIFACTS`; executed-result JSON files are retained under `evidence/`.

The engine, bridge, UI, and tests use 0BSD. Compiler/runtime components have their own notices in `third-party/`, also embedded as a comment in the standalone HTML so that the single-file download retains those notices. The full Debian compiler copyright inventory includes components not linked into this small module.
