# Strap 1.0 — exact output reflection

## Definition and state

Strap owns one `ratboy::Ratchet4` instance. The original five unsigned 64-bit words `(counter, x, y, z, w)`, two-word seed interface, initialization, 16 warm-up calls, recurrence, constants, and raw output mapping are unchanged. Strap adds no generator constants, warm-up, hidden seed filtering, or additional evolving generator state. The required header's SHA-256 is:

`afc73d26c5c7b33448f6e11a33c081c3d719a70183b70801da3d5f32f81ef1ae`

The complete recurrence is in that included source and the [original mathematical design](https://github.com/cammaxwel-droid/RATCHET4/blob/main/ratchet4-v1/docs/DESIGN.md). Strap does not claim a new original recurrence. “Inverted” here means reflecting output values, not reversing time or running an inverse state transition.

Let `M = 2^64 − 1`, and let `G` be the original seeded Ratchet instance.

- Raw call: get `r = G.next()`; return `s = M − r = ~r`.
- Bounded call with valid integer `1 ≤ B ≤ M`: get `r = G.bounded(B)`; return `s = B − 1 − r`.
- Paired methods return both `r` and `s` from that one source operation. A bounded operation may consume multiple raw words because original rejection sampling is retained.
- Zero/negative bounds are rejected; C++ bool/floating-point arguments are excluded. The browser API rejects fractional/negative/out-of-range input and unsafe JavaScript Number integers; large values use text or BigInt.
- `B = 1` returns `(0,0)` without advancing source state, matching Ratchet's contract.
- `state()` and `from_state()` preserve exact original state for research/replay. Revealed state predicts subsequent output; it is not a secret-protection facility.

A separate Ratchet instance and Strap instance align only when seeds and subsequent raw/bounded calls, including bounds, match exactly. Pair-returning methods avoid that coordination problem. Calling `next()` and then `next_pair()` consumes two raw outputs.

## Established properties

The following follow algebraically; tests are implementation evidence, not their proof.

1. **Range and inversion:** `0 ≤ M − r ≤ M`, and `0 ≤ B − 1 − r < B` for valid source results. Applying either reflection twice returns the original value. Each is a bijection on its respective range.
2. **Determinism and state:** a fixed seeded source call sequence determines both outputs. Reflection does not change source state or the number of raw words consumed by the original operation.
3. **Exact dependence:** raw paired values sum to `M`; bounded pairs sum to `B − 1`. Each numeric result uniquely determines the other. For any nonconstant sample with one fixed range, their numeric Pearson correlation is exactly −1 in exact arithmetic. For constant samples, correlation is undefined.
4. **Distribution:** the mirror permutes probability masses. It preserves uniformity if present, but reflects any bias rather than removing it. Raw entropy is unchanged under this one-to-one mapping; the pair carries no more information than the original. A stuck original bit becomes a stuck opposite bit.
5. **Period:** raw output complementation preserves whatever output period the original sequence has, because it is invertible. The underlying state transition is identical. No exact numeric state or output period is claimed. A fixed-bound output sequence likewise retains its period under its fixed reflection.
6. **Rejection sampling:** original `G.bounded(B)` accepts raw `x ≥ (2^64 mod B)` and returns `x mod B`. Those accepted integers contain equally sized residue classes. The usual unbiased-output conclusion requires suitable source randomness; this does not establish that Ratchet supplies it. Strap's uniformity claim is conditional on the original bounded result being uniform.

The implementation deliberately reflects *after* original bounded mapping. Independently rejection-sampling `~G.next()` could accept/reject different raw words and would not provide the same paired schedule.

## Return and jackpot implications

For a table with `B` entries and payout values `p_i`, if the selected index is uniform then both the original and mirrored selector have expected payout `sum(p_i) / B`. Reversing the index is a permutation, so it cannot tune that expectation. If original selection is biased, the mirrored payout expectation depends on where the biased masses land; no compensation guarantee follows.

Paired game outcomes would be dependent. Numeric anti-correlation does not imply payout anti-correlation: payouts, duplicate symbols, merge chains, state, and jackpot rules can map those indices in many ways. No jackpot, bankroll, payout, or target-return controller is implemented. RNG state is independent of accounting code because this prototype contains no accounting code.

## Observations and open questions

Tests cover zero, small, maximum, nearby, and single-bit seed cases, invalid bounds, replay, counter wrap, and changing call schedules. They are not exhaustive over 128-bit seeds or 320-bit states. Benchmarks and diagnostics are observations on the stated host, not mathematical guarantees.

This transformation has no basis for improving Ratchet's weak seeds, cycle structure, serial correlations, predictability, or outstanding statistical concerns. No new external suite result is claimed for Strap. Originality, security, fairness, and production suitability are not established by the adapter or its tests.
