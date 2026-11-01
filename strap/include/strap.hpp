// SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
// Strap is a dependent output mirror, not a new independent source engine.
#pragma once
#include "ratchet4.hpp"

namespace ratboy {
class Strap {
public:
    using result_type = Ratchet4::result_type;
    using State = Ratchet4::State;
    struct Pair { result_type ratchet; result_type strap; };

    explicit Strap(result_type seed0=0, result_type seed1=0) noexcept : source_(seed0,seed1) {}

    Pair next_pair() noexcept {
        const result_type value=source_.next();
        return {value, ~value};
    }
    result_type next() noexcept { return next_pair().strap; }

    template<class Int, std::enable_if_t<std::is_integral_v<Int>
        && !std::is_same_v<std::remove_cv_t<Int>, bool> && (sizeof(Int)<=8), int> = 0>
    Pair bounded_pair(Int bound) {
        // Delegate validation and rejection sampling BEFORE conversion/subtraction.
        // This also preserves Ratchet's no-draw contract for bound == 1.
        const result_type value=source_.bounded(bound);
        return {value, static_cast<result_type>(bound)-result_type{1}-value};
    }
    template<class Int, std::enable_if_t<std::is_integral_v<Int>
        && !std::is_same_v<std::remove_cv_t<Int>, bool> && (sizeof(Int)<=8), int> = 0>
    result_type bounded(Int bound) { return bounded_pair(bound).strap; }

    State state() const noexcept { return source_.state(); }
    static Strap from_state(State state) noexcept { return Strap(state,RestoreTag{}); }

private:
    struct RestoreTag {};
    Strap(State state,RestoreTag) noexcept : source_(Ratchet4::from_state(state)) {}
    Ratchet4 source_;
};
}
