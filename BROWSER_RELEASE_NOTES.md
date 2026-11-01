Download **P-RNG-Lab.html** and open it normally in Edge or Chrome. The single HTML file contains everything needed to run offline. No installation, `.cmd` launcher, administrator mode, or native executable is required.

The temporary review UI runs the approved, unchanged C++17 Ratchet-4 V1 engine compiled to WebAssembly. Features include seed controls, table/bounded/raw output, sequence replay, entry counts, recent outputs, one-click correctness checks, descriptive bit-frequency sampling, and JSON report export.

Executed evidence: 52,224 comparisons against the native C++ executable across 136 seed cases; 5,485 correctness assertions; 24 Chromium interaction checks including invalid-input handling, state preservation, export, offline operation, and desktop/mobile layout. Tests ran on Linux, not native Windows 11. The included optional native-launcher diagnostic update has not been executed on Windows.

The browser ZIP also includes source, build scripts, tests, evidence, and license notices. The original native review release remains unchanged.

This is still an experimental research/demo generator. Correctness checks and the descriptive histogram/bit sample do not establish security, fairness, statistical quality, or production suitability. Real-money deployment remains unapproved.
