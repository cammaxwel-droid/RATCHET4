// SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
#include "strap.hpp"
#include <chrono>
#include <iostream>
#include <array>
#include <algorithm>
using U=std::uint64_t;
template<class Make,class Next>void bench(const char* name,Make make,Next next){
    constexpr unsigned count=1000000;std::array<double,5> times{};U checksum=0;
    for(unsigned trial=0;trial<times.size();++trial){
        auto rng=make();U sum=0;const auto start=std::chrono::steady_clock::now();
        for(unsigned i=0;i<count;++i)sum^=next(rng);
        const auto end=std::chrono::steady_clock::now();checksum^=sum;
        times[trial]=std::chrono::duration<double,std::nano>(end-start).count()/count;
    }
    std::sort(times.begin(),times.end());
    std::cout<<name<<','<<count<<",5,"<<times[2]<<','<<times[0]<<','<<times[4]<<','<<checksum<<'\n';
}
int main(){
    std::cout<<"operation,draws_per_trial,trials,median_ns_per_draw,min_ns_per_draw,max_ns_per_draw,checksum\n";
    bench("Ratchet raw",[]{return ratboy::Ratchet4(123,456);},[](auto& r){return r.next();});
    bench("Strap raw",[]{return ratboy::Strap(123,456);},[](auto& r){return r.next();});
    bench("Paired raw",[]{return ratboy::Strap(123,456);},[](auto& r){const auto p=r.next_pair();return p.ratchet^ratboy::detail::rotl(p.strap,13);});
    bench("Strap bound 37",[]{return ratboy::Strap(123,456);},[](auto& r){return r.bounded(37);});
    bench("Strap rejection-heavy bound",[]{return ratboy::Strap(123,456);},[](auto& r){return r.bounded((U{1}<<63)+1);});
}
