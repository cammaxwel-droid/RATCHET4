// SPDX-License-Identifier: 0BSD
#include "ratchet4.hpp"
#include "../src/cli.hpp"
#include <algorithm>
#include <array>
#include <cstdint>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <utility>
#include <vector>

using U64 = std::uint64_t;
static std::size_t checks=0;
static void require(bool ok, const char* message) {
    ++checks;
    if (!ok) throw std::runtime_error(message);
}
template<class F> static void invalid(F f) {
    bool thrown=false;
    try { f(); } catch (const std::invalid_argument&) { thrown=true; }
    require(thrown,"expected invalid_argument");
}
template<class T, class = void> struct has_bound : std::false_type {};
template<class T> struct has_bound<T, std::void_t<decltype(std::declval<ratboy::Ratchet4&>().bounded(std::declval<T>()))>> : std::true_type {};
static_assert(!has_bound<double>::value && !has_bound<bool>::value, "noninteger/bool bounds must not compile");
static_assert(has_bound<int>::value && has_bound<U64>::value, "integer bounds must compile");
static_assert(sizeof(ratboy::Ratchet4)==40, "expected five uint64 words");

// Independent backward map, used only by the research tests.
static ratboy::Ratchet4::State backward(ratboy::Ratchet4::State state) {
    auto [c,x,y,z,w]=state;
    const auto& k=ratboy::detail::constants;
    for (int j=7;j>=0;--j) {
        const auto n=static_cast<std::size_t>(j);
        const U64 f=ratboy::detail::rotl(x+k[n]+c,17)
            ^ (ratboy::detail::rotl(y+k[(n+3)%8],41)+(y+k[(n+5)%8])*(z|U64{1}));
        const U64 oldx=w^f;
        w=z; z=y; y=x; x=oldx;
    }
    return {c-1,x,y,z,w};
}

int main() {
    try {
        const U64 max=std::numeric_limits<U64>::max();
        // Frozen outputs produced by the independent Python reference.
        const std::array<U64,8> expected={0x6a0d307c7b370277ULL,0x9d28c1a69e06b818ULL,
            0x635fde8525cc69faULL,0x4cef77dede30e757ULL,0x6a0001ea0333a5bbULL,
            0x2ad5c6807fdc26baULL,0xdb9507b052ef9104ULL,0x3dabc74f83ab9007ULL};
        ratboy::Ratchet4 rng;
        require(rng.state()[0]==16,"warm-up counter must remain 16");
        for (auto v:expected) require(rng.next()==v,"reference vector mismatch");
        for (U64 seed=0;seed<256;++seed) {
            ratboy::Ratchet4 a(seed,~seed),b(seed,~seed);
            for (unsigned n=0;n<256;++n) {
                require(a.next()==b.next(),"reproducibility");
                require(a.bounded(37)==b.bounded(37),"mixed-call reproducibility");
            }
        }
        const auto saved=rng.state();
        invalid([&] { (void)rng.bounded(0); });
        invalid([&] { (void)rng.bounded(-1); });
        invalid([&] { (void)rng.bounded(std::numeric_limits<std::int64_t>::min()); });
        invalid([&] { (void)rng.bounded(U64{0}); });
        require(rng.state()==saved,"invalid bound consumed state");
        require(rng.bounded(1)==0 && rng.state()==saved,"bound one contract");

        auto scripted=[](std::vector<U64> words,U64 bound,U64 expected_value,std::size_t expected_draws) {
            std::size_t pos=0;
            const auto value=ratboy::detail::bounded_from([&] { return words.at(pos++); },bound);
            require(value==expected_value && pos==expected_draws,"rejection boundary mismatch");
        };
        scripted({},1,0,0);
        scripted({0,3,6},10,6,3);
        scripted({max},10,5,1);
        scripted({0,max},max,0,2);
        scripted({(U64{1}<<63)-2,(U64{1}<<63)-1},(U64{1}<<63)+1,(U64{1}<<63)-1,2);
        scripted({max},U64{1}<<63,(U64{1}<<63)-1,1);
        for (unsigned bound=1;bound<=255;++bound) {
            const unsigned threshold=256U%bound;
            std::vector<unsigned> counts(bound,0);
            for (unsigned raw=threshold;raw<256;++raw) ++counts[raw%bound];
            for (auto n:counts) require(n==(256U-threshold)/bound,"8-bit mapping preimage imbalance");
        }
        std::vector<U64> bounds={1,2,3,7,10,37,255,256,257,max-1,max};
        for (unsigned bit=1;bit<64;++bit) {
            const U64 power=U64{1}<<bit;
            bounds.push_back(power-1); bounds.push_back(power); bounds.push_back(power+1);
        }
        for (auto bound:bounds) for (unsigned n=0;n<4096;++n)
            require(rng.bounded(bound)<bound,"bounded result out of range");

        for (U64 n=0;n<1024;++n) {
            const ratboy::Ratchet4::State s={n==0 ? max : n, n, ~n, n<<32, n*17};
            auto a=ratboy::Ratchet4::from_state(s);
            const auto first=a.next();
            require(backward(a.state())==s,"inverse including counter wrap");
            if (n==0) require(a.state()[0]==0,"counter wrap");
            auto clone=ratboy::Ratchet4::from_state(s);
            require(clone.next()==first,"state disclosure predicts output");
            for (unsigned i=0;i<16;++i) require(clone.next()==a.next(),"state clone predicts subsequent outputs");
        }
        const std::array<const char*,10> bad={"","-1","+1","1.0"," 1","1 ","0x","0xG","18446744073709551616","0x10000000000000000"};
        for (const auto* s:bad) invalid([&] { (void)parse_u64(s); });
        require(parse_u64("18446744073709551615")==max,"maximum decimal seed");
        require(parse_u64("0xffffffffffffffff")==max,"maximum hex seed");
        require(parse_u64("0")==0,"zero seed parser");
        std::cout << "PASS " << checks << " C++ checks; bounds, replay, reference vectors, inversion, counter wrap, predictability\n";
    } catch (const std::exception& e) { std::cerr << "FAIL: " << e.what() << '\n'; return 1; }
}
