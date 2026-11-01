// SPDX-License-Identifier: 0BSD
// Ratchet-4 V1: experimental, noncryptographic. See docs/DESIGN.md.
#pragma once
#include <array>
#include <cstdint>
#include <limits>
#include <stdexcept>
#include <type_traits>

namespace ratboy {
namespace detail {
using u64 = std::uint64_t;
inline constexpr std::array<u64, 8> constants = {
    0x2f73477d6a4563caULL, 0x6d1826cafd82e1edULL,
    0x8b43d4570a51b936ULL, 0xe360b596dc380c3fULL,
    0x1c456002ce13e9f8ULL, 0x6f19633143a0af0eULL,
    0xd94ebeb1ab313933ULL, 0x0cc4a61194f81760ULL
};
// Internal call sites use fixed counts strictly between zero and 64.
constexpr u64 rotl(u64 v, unsigned r) noexcept { return (v << r) | (v >> (64U-r)); }

// The mapping is testable independently of the experimental source engine.
template<class Source>
u64 bounded_from(Source&& next, u64 bound) {
    if (bound == 0) throw std::invalid_argument("bound must be positive");
    if (bound == 1) return 0; // Contract: consumes no state.
    const u64 threshold = (u64{0} - bound) % bound;
    for (;;) {
        const u64 value = next();
        if (value >= threshold) return value % bound;
    }
}
} // namespace detail

class Ratchet4 {
public:
    using result_type = std::uint64_t;
    // Order: counter, x, y, z, w. State exposure is for replay/research.
    using State = std::array<result_type, 5>;
    static_assert(std::numeric_limits<result_type>::digits == 64, "uint64_t required");

    explicit Ratchet4(result_type seed0 = 0, result_type seed1 = 0) noexcept
        : state_{0, seed0 ^ detail::constants[0], seed1 ^ detail::constants[1],
                 (~seed0) ^ detail::constants[2], (~seed1) ^ detail::constants[3]} {
        for (unsigned i = 0; i < 16; ++i) (void)next();
    }

    result_type next() noexcept {
        auto& c = state_[0];
        auto& x = state_[1];
        auto& y = state_[2];
        auto& z = state_[3];
        auto& w = state_[4];
        ++c;
        for (unsigned j = 0; j < 8; ++j) {
            const result_type f = detail::rotl(y + detail::constants[j] + c, 17)
                ^ (detail::rotl(z + detail::constants[(j+3U) % 8U], 41)
                   + (z + detail::constants[(j+5U) % 8U]) * (w | result_type{1}));
            const result_type last = x ^ f;
            x = y; y = z; z = w; w = last;
        }
        return (x + detail::rotl(y, 23)) ^ detail::rotl(z+w, 47);
    }

    // Constraining the only overload blocks floating-point/bool conversions.
    template<class Int, std::enable_if_t<std::is_integral_v<Int>
        && !std::is_same_v<std::remove_cv_t<Int>, bool> && (sizeof(Int) <= 8), int> = 0>
    result_type bounded(Int bound) {
        if constexpr (std::is_signed_v<Int>) {
            if (bound <= 0) throw std::invalid_argument("bound must be positive");
        } else {
            if (bound == 0) throw std::invalid_argument("bound must be positive");
        }
        return detail::bounded_from([this]() { return next(); }, static_cast<result_type>(bound));
    }

    State state() const noexcept { return state_; }
    static Ratchet4 from_state(State state) noexcept { return Ratchet4(state, RestoreTag{}); }

private:
    struct RestoreTag {};
    Ratchet4(State state, RestoreTag) noexcept : state_(state) {}
    State state_;
};
} // namespace ratboy
