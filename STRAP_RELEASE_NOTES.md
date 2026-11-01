# Strap 1.0 — Ratchet first; Strap second

Download **Strap-Lab.html**, then open it in Edge or Chrome. It runs offline using the actual C++17 Strap adapter and unchanged Ratchet engine compiled to WebAssembly. Ratchet is already bundled; no installer, administrator mode, or command launcher is needed.

The page shows each original result alongside its mirror, with seed controls, replay, raw/bounded/table modes, paired histograms, automated checks, a descriptive sample, and JSON export. Raw bits are complemented; bounded indices become `bound − 1 − original`.

**Strap-Review.zip** includes the HTML, complete C++/UI source, CMake configuration, one-command tests, frozen vectors, build scripts, mathematical notes, licenses, and executed evidence.

New Strap code uses the custom **Ratchet Required License 1.0**, requiring the supplied original Ratchet engine. Ratchet keeps its existing 0BSD license. The required source and licenses are included in both downloads. Custom license wording has not been legally reviewed.

Executed: 1,351,009 native C++ assertions; 52,224 browser/native paired comparisons across 136 seed cases; 160 frozen Strap reference outputs; 4,480 in-page assertions; 29 browser interaction checks; sanitizer and dependency checks; descriptive diagnostics across eight seeds. Linux/Chromium tested; Windows 11/Edge not executed here.

Paired outputs are fully dependent. Mirroring does not fix bias, tune returns, or balance jackpots. Original statistical warnings and investigation remain relevant. No new external randomness-suite result, security/fairness certification, or real-money deployment approval is claimed. Original Ratchet releases are preserved.
