Historical record: the user approved this proposal after its creation. Its original pre-approval wording is preserved below. See RESULTS.md for the implementation status.

# V1 proposal — awaiting approval, not implemented

Propose **Ratchet-4 V1**, a C++17 experimental generator with two 64-bit seed
words, four evolving 64-bit mixing words, and a 64-bit counter. Eight reversible
rounds per draw combine additions, rotations, XOR, and multiplication. Return
one 64-bit unsigned word; use rejection mapping for table indices. Implement
and test only after approval. Originality is proposed, not guaranteed.

## Exact proposed mathematics

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

Apply 16 complete transitions as defined below, discarding their outputs.
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
choose byte order; the planned stream format is little-endian.

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

Proposed `bounded(bound)` accepts integer bounds 1 through 2^64-1. Reject
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

## Weaknesses, hypotheses, and untested questions

- **Proven predictability limits:** public or known seeds reproduce every
  output. A full-state disclosure predicts all future draws and, because
  the transition is reversible, recovers past states. There is no
  backtracking resistance. A 128-bit seed interface provides at most
  128 bits of seed uncertainty, and a 64-bit convenience seed at most 64;
  neither is a claimed security strength.
- **Unresolved attacks:** no lower bound on seed/state recovery work from
  outputs is established. Truncating/folding state does not establish
  security. No cryptographic claim is proposed.
- **Mixing hypothesis:** rotations and multiword feedback should disrupt
  V0's simple invariant region. That is a reason to investigate, not a
  proof of good output. Zero, sparse, nearby, equal-word, complementary,
  alternating-bit, maximum, and power-of-two seeds require actual tests.
- **Correlation risks:** adjacent outputs, individual bits, low/high
  halves, reversed bits, nearby-seed streams, and early outputs might
  reveal structure. The fixed rotation/round choices are unvalidated.
- **Cycles:** the full-state bound above rules out short full-state cycles,
  but projected-state/output cycles and stream overlaps remain concerns.
  Reduced-width enumeration can expose weaknesses but cannot prove the
  64-bit generator's period or quality.
- **Performance:** 40 logical state bytes, fixed work per raw call, eight
  64-bit low-word multiplications and no allocation or 128-bit compiler
  extension. Throughput and initialization cost have not been measured.

No replacement implementation, reference vectors, avalanche measurements,
correlation tests, external-suite runs, or speed results exist yet.

## Relationship to prior work and scope of originality

The proposal uses established reversible-round and counter techniques.
The proposed contribution is this particular state recurrence, initialization,
and output combination. No established RNG implementation supplies the
engine. Limited comparison with the following primary sources does not
constitute a novelty or patent search:

- [PCG's own design description](https://www.pcg-random.org/index.html)
  identifies an LCG state transition followed by a permutation output.
  V1 instead evolves a counter and four words through reversible rounds.
- [Bob Jenkins' small PRNG](https://www.burtleburtle.net/bob/rand/smallprng.html)
  provides a different four-word recurrence and discusses mixing and
  weak states. V1 does not use that recurrence; word count and operations
  alone are not novel.
- [Salmon et al., Parallel Random Numbers: As Easy as 1, 2, 3](https://citeseerx.ist.psu.edu/document?doi=38bc7fc62136ec779d91b86b6e960a06d67b4a97&repid=rep1&type=pdf)
  studies keyed counter transformations. V1 retains evolving mixing words
  between draws instead of deriving each draw solely from a counter and
  fixed seed key. Counters and reversible mixing are established ideas.
- [PCG's predictability discussion](https://www.pcg-random.org/predictability.html)
  explains why statistical success is compatible with predictability.

These comparisons are our analysis of the proposed formulas, not an
endorsement from the cited authors. Originality cannot be guaranteed.

## Work after approval

1. Implement the specified C++17 engine, checked bounds, explicit stream
   format, independent reference model, and a tiny table-index selection
   demo. Keep V0 excluded from the normal build and demo.
2. Validate reproducibility, reference vectors, seed boundaries, invalid
   input behavior, counter wrap, state inversion, and bounded mapping.
   Exhaustively check reduced-width rejection mappings and force rejection
   boundary cases with controlled test sources.
3. Diagnose multiple seeds and all bit positions; test avalanche, lag
   correlations, low/high/reversed streams, and nearby-seed behavior.
   State sample sizes and multiple-testing limits. Record failures without
   changing seeds to conceal them. Investigate reduced-width cycles and
   explicitly test state-compromise predictability.
4. Attempt [PractRand](https://pracrand.sourceforge.net/) from its
   [official distribution](https://sourceforge.net/projects/pracrand/files/).
   No external suite is installed on the current PATH. If obtainable,
   pin its version and archive commands, seeds, sample sizes, and output.
   Keep third-party testing code/license separate from the 0BSD engine.
   If unavailable, report the limitation without calling internal checks
   independent external testing.
5. Measure optimized raw and bounded throughput plus seeding cost, with
   compiler flags, CPU, sample sizes, repeated timings, and a consumed
   checksum. Package source, build configuration, automated tests, README,
   evidence, and runnable binaries for the platforms actually built.
   Windows build/run results must be distinguished from Linux results.

Any observed serious defect requires documenting it and revisiting the
design, not declaring success or hiding a failing seed. Testing will not
establish security, game fairness, production suitability, or real-money
readiness. Game-return analysis remains separate. No payouts, jackpot
balancing, seed filtering, payout correction, or complete game are included.
