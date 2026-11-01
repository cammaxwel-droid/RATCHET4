// SPDX-License-Identifier: 0BSD
// V0: KNOWN DEFECTIVE. Research reproduction only; never a gameplay engine.
// Reconstructed from the user's handoff; no previous source file was present.
#include <cstdint>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <limits>

using U64 = std::uint64_t;
static_assert(std::numeric_limits<U64>::digits == 64, "64-bit type required");

static U64 reverse_bits(U64 x) {
    x = ((x >> 1) & 0x5555555555555555ULL) | ((x & 0x5555555555555555ULL) << 1);
    x = ((x >> 2) & 0x3333333333333333ULL) | ((x & 0x3333333333333333ULL) << 2);
    x = ((x >> 4) & 0x0f0f0f0f0f0f0f0fULL) | ((x & 0x0f0f0f0f0f0f0f0fULL) << 4);
    x = ((x >> 8) & 0x00ff00ff00ff00ffULL) | ((x & 0x00ff00ff00ff00ffULL) << 8);
    x = ((x >> 16) & 0x0000ffff0000ffffULL) | ((x & 0x0000ffff0000ffffULL) << 16);
    return (x >> 32) | (x << 32);
}

struct KnownDefectiveV0 {
    U64 t = 0, a, b;
    U64 next() {
        ++t;
        for (U64 j = 1; j <= 3; ++j) {
            a = (2 * b + 1) * a + reverse_bits(b * b + j * t);
            b = (2 * a + 1) * b + reverse_bits(a * a + (2 * j + 1) * t);
        }
        return a ^ reverse_bits(b);
    }
};

int main() {
    const U64 seeds[][2] = {
        {0, 0}, {0, 1}, {1, 0}, {1, 1}, {2, 0}, {0, 2},
        {0x8000000000000000ULL, 0}, {0, 0x8000000000000000ULL},
        {~U64{0}, ~U64{0}}, {0xaaaaaaaaaaaaaaaaULL, 0x5555555555555555ULL}
    };
    // CSV includes all state words to allow an independent implementation check.
    std::cout << "seed0,seed1,call,t,a,b,output\n";
    for (const auto& seed : seeds) {
        KnownDefectiveV0 rng{0, seed[0], seed[1]};
        for (unsigned n = 1; n <= 4096; ++n) {
            const U64 output = rng.next();
            std::cout << std::hex << std::setfill('0')
                      << std::setw(16) << seed[0] << ',' << std::setw(16) << seed[1]
                      << ',' << std::dec << n << ',' << std::hex
                      << std::setw(16) << rng.t << ',' << std::setw(16) << rng.a
                      << ',' << std::setw(16) << rng.b << ',' << std::setw(16) << output << '\n';
        }
    }
}
