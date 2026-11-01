# P-RNG — Lett-uce Guess / Ratchet-4 V1

[**Download the complete P-RNG review ZIP**](https://github.com/cammaxwel-droid/P_RNG_LETT-UCE-GUESS/releases/download/v1-review-20261101/P-RNG-Review.zip)

Extract the ZIP, then double-click **START_DEMO.cmd** inside `P-RNG-Review` to try it. No compiler is required for the included Windows x64 executable.

To put a separate review copy in your Documents folder, double-click **COPY_TO_DOCUMENTS.cmd**. It creates a new folder, checks the copied files, and opens it.

The complete download contains the original C++17 source, Windows and Linux executables, automated tests, mathematical design notes, original test results, and the subsequent NS3 warning investigation. The Windows executable was tested under Wine; native Windows 11 execution and the Documents helper have not been verified.

**Status: experimental research/demo prototype.** Statistical warnings and evidence of NS3 small-sample calibration problems are preserved. This is not approved for production or real-money use. V0 is archived as known defective and is excluded from the demo. V1's engine is unchanged.

- [Browse the C++ engine](ratchet4-v1/include/ratchet4.hpp)
- [Design and mathematical limitations](ratchet4-v1/docs/DESIGN.md)
- [Original test results](ratchet4-v1/docs/RESULTS.md)
- [Latest investigation](investigation/README.md)
- [Review release and download files](https://github.com/cammaxwel-droid/P_RNG_LETT-UCE-GUESS/releases/tag/v1-review-20261101)

The source and documentation are freely reusable under [0BSD](LICENSE); separate third-party notices are retained. Originality is proposed, not guaranteed.

The browsable source tree omits the executable and large evidence directories; those are included in full in the review ZIP. The repository workflow reconstructs that exact ZIP from the transport payload, verifies its SHA-256 and every packaged file, then attaches it to the review prerelease. It does not rebuild or modify the engine.

ZIP SHA-256: `14e51788c3f9d63c33b0f7aff69e782521053a20bfe8988e1a27e35bbee2e33d`.
