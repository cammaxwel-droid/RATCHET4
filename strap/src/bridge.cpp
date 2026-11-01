// SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
#include "strap.hpp"
#include <emscripten/emscripten.h>
struct Handle {
    ratboy::Strap rng;
    ratboy::Strap::Pair last{0,0};
    int error=0;
    Handle(std::uint64_t a,std::uint64_t b):rng(a,b){}
};
extern "C" {
EMSCRIPTEN_KEEPALIVE Handle* pair_new(std::uint64_t a,std::uint64_t b){return new Handle(a,b);}
EMSCRIPTEN_KEEPALIVE void pair_delete(Handle* h){delete h;}
EMSCRIPTEN_KEEPALIVE void pair_seed(Handle* h,std::uint64_t a,std::uint64_t b){h->rng=ratboy::Strap(a,b);h->last={0,0};h->error=0;}
EMSCRIPTEN_KEEPALIVE std::uint64_t pair_next(Handle* h){h->error=0;h->last=h->rng.next_pair();return h->last.strap;}
EMSCRIPTEN_KEEPALIVE std::uint64_t pair_bounded(Handle* h,std::uint64_t b){
    h->error=0;
    try{h->last=h->rng.bounded_pair(b);return h->last.strap;}
    catch(const std::invalid_argument&){h->error=1;return 0;}
}
EMSCRIPTEN_KEEPALIVE int pair_error(Handle* h){return h->error;}
EMSCRIPTEN_KEEPALIVE std::uint64_t pair_original(Handle* h){return h->last.ratchet;}
EMSCRIPTEN_KEEPALIVE std::uint64_t pair_state(Handle* h,unsigned i){return i<5?h->rng.state()[i]:0;}
}
