// SPDX-License-Identifier: 0BSD
#include "ratchet4.hpp"
#include "../src/cli.hpp"
#include <iostream>
#include <string>
int main() {
    try {
        std::string a,b;
        while (std::cin>>a) {
            if (!(std::cin>>b)) return 2;
            ratboy::Ratchet4 rng(parse_u64(a),parse_u64(b));
            std::cout<<rng.next()<<'\n';
        }
    } catch (const std::exception& e) { std::cerr<<e.what()<<'\n'; return 2; }
}
