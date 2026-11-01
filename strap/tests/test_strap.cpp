// SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
#include "strap.hpp"
#include <iostream>
#include <vector>
#include <utility>
#include <limits>
#include <stdexcept>
#include <string>

using U=std::uint64_t;
std::size_t checks=0;
void check(bool ok,const char* message){++checks;if(!ok)throw std::runtime_error(message);}
template<class T,class=void>struct accepts_bound:std::false_type{};
template<class T>struct accepts_bound<T,std::void_t<decltype(std::declval<ratboy::Strap&>().bounded(std::declval<T>()))>>:std::true_type{};
static_assert(!accepts_bound<bool>::value && !accepts_bound<double>::value);

int main(){try{
    constexpr U max=std::numeric_limits<U>::max();
    std::vector<std::pair<U,U>> seeds={{0,0},{1,0},{0,1},{1,1},{max,max},{max,0},{0,max},{123,456}};
    for(unsigned b=0;b<64;++b){seeds.push_back({U{1}<<b,0});seeds.push_back({0,U{1}<<b});}
    const std::vector<U> bounds={1,2,3,8,37,(U{1}<<32)+1,(U{1}<<63)+1,max};
    for(const auto& seed:seeds){
        ratboy::Ratchet4 original(seed.first,seed.second);
        ratboy::Strap strap(seed.first,seed.second),paired(seed.first,seed.second);
        for(unsigned i=0;i<1024;++i){
            const U r=original.next(),s=strap.next();const auto p=paired.next_pair();
            check(s==~r,"raw complement");check(p.ratchet==r && p.strap==s,"pair equivalence");
            check((s^r)==max,"all bits opposite");check(strap.state()==original.state() && paired.state()==original.state(),"raw state alignment");
        }
        // Mix raw and bounded calls with evolving state; never reseed per draw.
        for(unsigned i=0;i<2048;++i){
            if(i%3==0){const auto r=original.next(),s=strap.next();const auto p=paired.next_pair();check(s==~r && p.ratchet==r && p.strap==s,"mixed raw");}
            else{const U b=bounds[i%bounds.size()],r=original.bounded(b),s=strap.bounded(b);const auto p=paired.bounded_pair(b);
                check(s<b && r<b,"bounded range");check(s==b-1-r && p.ratchet==r && p.strap==s,"bounded mirror");}
            check(strap.state()==original.state() && paired.state()==original.state(),"mixed state alignment");
        }
        const auto saved=strap.state();auto replay=ratboy::Strap::from_state(saved);
        for(unsigned i=0;i<128;++i)check(strap.next()==replay.next(),"state replay");
        const auto before=strap.state();
        for(int b:{0,-1,-37}){bool rejected=false;try{(void)strap.bounded(b);}catch(const std::invalid_argument&){rejected=true;}check(rejected,"invalid bound rejection");check(strap.state()==before,"invalid bound state preservation");}
        const auto one=strap.bounded_pair(1);check(one.ratchet==0 && one.strap==0 && strap.state()==before,"bound one no draw");
    }
    // Counter wrap uses the existing base transition without changing it.
    auto state=ratboy::Ratchet4(0,0).state();state[0]=max;
    auto original=ratboy::Ratchet4::from_state(state);auto strap=ratboy::Strap::from_state(state);
    check(strap.next()==~original.next() && strap.state()==original.state(),"counter wrap");
    // Every value occurs once under each finite mirror permutation.
    for(U b=1;b<=256;++b){std::vector<unsigned> count(b);for(U r=0;r<b;++r)++count[b-1-r];for(auto n:count)check(n==1,"finite bijection");}
    std::cout<<"PASS "<<checks<<" Strap assertions; "<<seeds.size()<<" seed cases; raw/bounded/mixed calls, replay, invalid bounds, wrap, mirror bijections\n";
    return 0;
}catch(const std::exception& e){std::cerr<<"FAIL: "<<e.what()<<'\n';return 1;}}
