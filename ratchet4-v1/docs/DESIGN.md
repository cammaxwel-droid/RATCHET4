# Ratchet-4 V1 — implemented design

The user approved this design. The implementation follows the recurrence and constants without modifications. See [results](RESULTS.md) for measured evidence and limitations.

## Specified mathematics

All word arithmetic wraps modulo 2^64. XOR, OR, and NOT are bitwise;
rotl(v,r) is a 64-bit left rotation. Tuples on the right-hand side always use
the old values of that round. No signed arithmetic, external RNG, or
randomness library is part of the engine.

State: (c,x,y,z,w), five words / 320 bits / 40 bytes of logical state.
The seed interface is (s0,s1); a one-word convenience seed means (s0,0).
All bit patterns, including both words zero, are valid.

Initialize:

    c = 0
    x = s0 XOR K0
    y = s1 XOR K1
    z = NOT(s0) XOR K2
    w = NOT(s1) XOR K3

The constructor applies 16 complete transitions as defined below, discarding their outputs.
Keep the resulting counter c=16; do not reset it. This is initialization
only, not reseeding on selection. Sixteen discarded transitions are a
provisional diffusion margin, not an established statistical requirement.

Each raw draw:

    c <- c + 1
    For j = 0,...,7:
        F_j(y,z,w,c) = rotl(y + K_j + c,17)
                      XOR (rotl(z + K_((j+3) mod 8),41)
                           + (z + K_((j+5) mod 8)) * (w OR 1))
        (x,y,z,w) <- (y,z,w, x XOR F_j(y,z,w,c))
    Return (x + rotl(y,23)) XOR rotl(z+w,47)

The counter is fixed throughout the eight rounds of a draw. The subscript
modulo operation is only on the constant index, not on a state word.

Constants are the first 64 fractional binary bits of square roots of the
first eight primes greater than 64: p=(67,71,73,79,83,89,97,101).
Precisely K_j = floor(sqrt(p_j)*2^64) - floor(sqrt(p_j))*2^64.
They were calculated with integer square root, avoiding floating-point
rounding. This is a transparent parameter recipe, not a generator or a
claim of random constants. They were not selected by testing outputs.

| j | K_j |
|---|---|
| 0 | 0x2f73477d6a4563ca |
| 1 | 0x6d1826cafd82e1ed |
| 2 | 0x8b43d4570a51b936 |
| 3 | 0xe360b596dc380c3f |
| 4 | 0x1c456002ce13e9f8 |
| 5 | 0x6f19633143a0af0e |
| 6 | 0xd94ebeb1ab313933 |
| 7 | 0x0cc4a61194f81760 |

Rotations 17 and 41 move information between distant bit positions; 23 and
47 mix the output words at different offsets. These are initial design
choices, not optimized or proven optimal constants. Eight rounds give two
complete four-word sweeps. Products supply interactions between words,
while rotation and addition provide paths beyond products alone. Forcing
one product factor odd prevents that factor from being zero or even, but
does not establish mixing quality or absence of weak states. The rotating
four-word recurrence is a structural replacement for V0's two-word update,
not a change to V0's constants or a seed filter.

## Properties established algebraically

**Determinism.** Fixed-width unsigned arithmetic and specified rotations give
identical sequences for identical seeds and identical successful call
sequences, independent of host endianness. Serialization must explicitly
choose byte order; the stream format is little-endian.

**Reversible full-state transition.** For a round result (X,Y,Z,W), recover
(x,y,z,w) = (W XOR F_j(X,Y,Z,c), X,Y,Z). Undo rounds in reverse order and
subtract one from c to invert a whole draw. Hence the transition permutes
the finite full state space; it has no state-merging trees or transient
prefix before a cycle. This is an ordinary generalized Feistel technique,
not a new mathematical primitive.

**Cycle bound, not an exact period.** Returning to the same full state
requires the counter to return, so every full-state cycle length is a
positive multiple of 2^64 and is at most 2^320. This does not establish
the cycle length reached by any seed, a minimum output-sequence period,
statistical quality, or freedom from short output patterns. V0 itself
illustrates why a counter bound is insufficient.

**No seed collisions at the same draw count.** The initial map is injective
because x and y recover both seed words. Applying the same bijective
warm-up preserves injectivity. It remains injective after any equal
number of raw draws. This does not prove disjoint streams, independent
streams, or different outputs for different seeds. Bounded calls can
consume different numbers of raw draws.

**Output balance over the complete state space only.** With y,z,w fixed,
the output is a bijection of x. Thus every 64-bit word has equally many
preimages across uniformly sampled full states. The 128-bit seed family
does not sample the full 320-bit state space uniformly; this observation
proves neither seed-induced uniformity nor uniformity along a cycle.

## Bounded mapping and invalid inputs

`bounded(bound)` accepts integer bounds 1 through 2^64-1. Reject
zero, negative signed arguments, noninteger arguments, and parsed integers
outside that range, before changing state. Use checked signed overloads
or constrained integer interfaces to prevent accidental negative-to-unsigned
conversion. `bounded(1)` returns zero without consuming a raw draw.

For bound > 1 compute threshold = (2^64 mod bound), using unsigned wrap
as `(uint64_t(0)-bound) % bound`. Draw raw r until r >= threshold, then
return r % bound. The accepted interval has a length divisible by bound,
so each residue has equal preimage count. Uniform bounded results require
appropriate raw-source behavior; rejection does not fix bias or dependence.
Expected fewer than two draws and almost-sure termination hold for ideal
independent uniform draws, not as unconditional guarantees for V1. A
defective deterministic stream could remain in the rejection interval.


## Limitations

Originality is proposed, not guaranteed. Standard reversible-round and counter techniques are acknowledged in the [frozen proposal](APPROVED_PROPOSAL.md). The counter bound is a full-state property, not an output-period or randomness guarantee.

Known seeds predict outputs. State disclosure reveals future draws and permits reversal of prior states. No security strength or backtracking resistance is claimed. Passing finite tests does not establish fairness, production suitability, or real-money readiness.

The two-bit toy model has four-step state cycles. Tiny-width results illustrate that reversibility alone does not imply a single maximum-length cycle; they cannot establish the 64-bit period. Exact full-state and output periods for V1 remain unknown.

The engine never filters seeds, balances jackpots, corrects payouts, or applies merge rules. Accounting and game-return analysis belong in separate systems.
