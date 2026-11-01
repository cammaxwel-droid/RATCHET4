# P-RNG — Lett-uce Guess / Ratchet-4 V1

[**Download the browser review interface — P-RNG-Lab.html**](https://github.com/cammaxwel-droid/P_RNG_LETT-UCE-GUESS/releases/download/v1-browser-review-20261101/P-RNG-Lab.html)

Open the downloaded HTML file normally in **Edge or Chrome**. It runs offline, with no installation, `.cmd` launcher, administrator mode, or separate executable. This is the recommended review interface if Windows blocks the unsigned native demo.

The interface runs the **same unchanged C++17 engine compiled to WebAssembly**. It includes seed controls, table/bounded/raw draws, replay, a histogram, recent outputs, a **Run checks** button, descriptive bit-frequency sampling, and report export.

The browser engine matched **52,224 native C++ outputs across 136 seed cases**. Its 5,485 correctness assertions and 24 browser interaction checks passed. Tests ran on Linux/Chromium; Windows 11 and Edge on Windows have not been executed here.

- [Browser UI documentation, source and executed results](browser-ui/README.md)
- [Complete browser review ZIP](https://github.com/cammaxwel-droid/P_RNG_LETT-UCE-GUESS/releases/download/v1-browser-review-20261101/P-RNG-Browser-Review.zip)
- [Original native review package and full research evidence](https://github.com/cammaxwel-droid/P_RNG_LETT-UCE-GUESS/releases/download/v1-review-20261101/P-RNG-Review.zip)
- [C++ engine](ratchet4-v1/include/ratchet4.hpp)
- [Mathematical design](ratchet4-v1/docs/DESIGN.md)
- [Original statistical results](ratchet4-v1/docs/RESULTS.md)
- [NS3 warning investigation](investigation/README.md)

**Status: experimental research/demo prototype.** Correctness checks do not establish security, fairness, or production suitability. Original statistical warnings and the later calibration investigation are preserved. Real-money deployment is not approved. V0 remains archived as known defective and is excluded from the demo.

The original native Windows executable was tested under Wine and is unsigned. The updated repository launcher gives a clearer message when its executable is missing; it does not sign or unblock that executable. The browser interface avoids invoking it.

The source and project documents use [0BSD](LICENSE); compiler/runtime and other third-party notices are retained. Originality is proposed, not guaranteed. Original native release files are unchanged.
