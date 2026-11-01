// SPDX-License-Identifier: 0BSD
// Browser interface to the unchanged approved C++17 engine.
#include "ratchet4.hpp"
#include <emscripten/emscripten.h>

struct Handle {
    ratboy::Ratchet4 rng;
    int error = 0;
    Handle(std::uint64_t a, std::uint64_t b) : rng(a,b) {}
};
extern "C" {
EMSCRIPTEN_KEEPALIVE Handle* rng_new(std::uint64_t a, std::uint64_t b) { return new Handle(a,b); }
EMSCRIPTEN_KEEPALIVE void rng_delete(Handle* h) { delete h; }
EMSCRIPTEN_KEEPALIVE void rng_seed(Handle* h, std::uint64_t a, std::uint64_t b) { h->rng=ratboy::Ratchet4(a,b); h->error=0; }
EMSCRIPTEN_KEEPALIVE std::uint64_t rng_next(Handle* h) { return h->rng.next(); }
EMSCRIPTEN_KEEPALIVE std::uint64_t rng_bounded(Handle* h, std::uint64_t bound) {
    h->error=0;
    try { return h->rng.bounded(bound); }
    catch (const std::invalid_argument&) { h->error=1;return 0; }
}
EMSCRIPTEN_KEEPALIVE int rng_error(Handle* h) { return h->error; }
EMSCRIPTEN_KEEPALIVE std::uint64_t rng_state_word(Handle* h, unsigned word) { return word<5 ? h->rng.state()[word] : 0; }
}
