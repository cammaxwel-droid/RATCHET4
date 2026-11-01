// SPDX-License-Identifier: 0BSD
#include "ratchet4.hpp"
#include "cli.hpp"
#include <algorithm>
#include <chrono>
#include <iomanip>
#include <iostream>
#include <vector>

int main(int argc,char** argv) {
    try {
        const std::uint64_t count=argc>1 ? parse_u64(argv[1]) : 5000000;
        if (count<1000) throw std::invalid_argument("benchmark count must be >= 1000");
        volatile std::uint64_t consumed=0;
        std::cout<<"mode,operations,repeat,seconds,ns_per_operation,checksum\n";
        for (const auto* mode:{"raw","bounded37","bounded_worst","seed_and_first"}) {
            const std::uint64_t n=std::string(mode)=="seed_and_first" ? count/16 : count;
            ratboy::Ratchet4 rng(123,456);
            for (unsigned i=0;i<10000;++i) consumed=consumed^rng.next();
            for (unsigned rep=0;rep<5;++rep) {
                std::uint64_t sum=0;
                const auto begin=std::chrono::steady_clock::now();
                if (std::string(mode)=="raw") for (std::uint64_t i=0;i<n;++i) sum^=rng.next();
                else if (std::string(mode)=="bounded37") for (std::uint64_t i=0;i<n;++i) sum^=rng.bounded(37);
                else if (std::string(mode)=="bounded_worst") for (std::uint64_t i=0;i<n;++i) sum^=rng.bounded((std::uint64_t{1}<<63)+1);
                else for (std::uint64_t i=0;i<n;++i) { ratboy::Ratchet4 seeded(i,rep); sum^=seeded.next(); }
                const double elapsed=std::chrono::duration<double>(std::chrono::steady_clock::now()-begin).count();
                consumed=consumed^sum;
                std::cout<<mode<<','<<n<<','<<rep<<','<<std::setprecision(10)<<elapsed<<','
                         <<elapsed*1e9/static_cast<double>(n)<<','<<sum<<'\n';
            }
        }
        std::cerr<<"consumed checksum: "<<consumed<<'\n';
    } catch (const std::exception& e) { std::cerr<<e.what()<<'\n'; return 2; }
}
