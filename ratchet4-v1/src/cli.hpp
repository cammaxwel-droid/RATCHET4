// SPDX-License-Identifier: 0BSD
#pragma once
#include <charconv>
#include <cstdint>
#include <stdexcept>
#include <string>
#include <string_view>

inline std::uint64_t parse_u64(std::string_view text) {
    if (text.empty() || text.front() == '-' || text.front() == '+')
        throw std::invalid_argument("expected an unsigned decimal or 0x hexadecimal integer");
    int base = 10;
    if (text.size() >= 2 && text[0] == '0' && (text[1] == 'x' || text[1] == 'X')) {
        text.remove_prefix(2); base = 16;
    }
    if (text.empty()) throw std::invalid_argument("missing integer digits");
    std::uint64_t value = 0;
    const auto parsed = std::from_chars(text.data(), text.data()+text.size(), value, base);
    if (parsed.ec != std::errc{} || parsed.ptr != text.data()+text.size())
        throw std::invalid_argument("invalid integer or value outside 0..2^64-1");
    return value;
}
