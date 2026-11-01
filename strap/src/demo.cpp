// SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
#include "strap.hpp"
#include <iostream>
int main(){
    ratboy::Strap rng{0,0};
    for(int i=0;i<10;++i){const auto pair=rng.bounded_pair(8);std::cout<<"Ratchet "<<pair.ratchet<<" | Strap "<<pair.strap<<" | sum "<<pair.ratchet+pair.strap<<'\n';}
}
