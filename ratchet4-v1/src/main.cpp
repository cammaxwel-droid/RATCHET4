// SPDX-License-Identifier: 0BSD
#include "ratchet4.hpp"
#include "cli.hpp"
#include <algorithm>
#include <array>
#include <cstdio>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

using U64 = std::uint64_t;
constexpr std::array<const char*, 8> table = {"Leaf", "Twig", "Stone", "Leaf", "Acorn", "Twig", "Crystal", "Leaf"};

static void draws(ratboy::Ratchet4& rng, U64 count) {
    if (count > 1000000) throw std::invalid_argument("text demo count is limited to 1000000");
    for (U64 i = 0; i < count; ++i) {
        const auto index = rng.bounded(table.size());
        std::cout << "index " << index << "  " << table[static_cast<std::size_t>(index)] << '\n';
    }
}

static void interactive() {
    ratboy::Ratchet4 rng;
    std::cout << "RAT-BOY / Ratchet-4 V1\nExperimental table-selection demo / seed (0,0)\n\n";
    for (std::size_t i=0; i<table.size(); ++i) std::cout << i << ": " << table[i] << '\n';
    std::cout << "\nEach table entry is a separate selectable index.\n"
              << "Enter: draw 10 | draw N | seed A B | q: quit\n"
              << "Research demo only: statistical review is unresolved.\n"
              << "Selection does not apply merges or payouts.\n";
    std::string line;
    while (std::cout << "\n> " && std::getline(std::cin, line)) {
        try {
            if (line.empty()) { draws(rng, 10); continue; }
            std::istringstream input(line);
            std::string command, a, b, extra;
            input >> command;
            if (command == "q" || command == "quit") return;
            if (command == "draw" && (input >> a) && !(input >> extra)) draws(rng, parse_u64(a));
            else if (command == "seed" && (input >> a >> b) && !(input >> extra)) {
                const U64 s0 = parse_u64(a), s1 = parse_u64(b);
                rng = ratboy::Ratchet4(s0, s1);
                std::cout << "Seed set to (" << s0 << ',' << s1 << ").\n";
            } else std::cout << "Use Enter, draw N, seed A B, or q.\n";
        } catch (const std::exception& e) { std::cout << "Error: " << e.what() << '\n'; }
    }
}

static U64 reversed(U64 value) {
    U64 result=0;
    for (unsigned i=0; i<64; ++i) { result = (result << 1) | (value & 1); value >>= 1; }
    return result;
}

static void stream(U64 bytes, U64 s0, U64 s1, const std::string& mode) {
    if (mode!="raw" && mode!="low" && mode!="high" && mode!="reverse" && mode!="nearby")
        throw std::invalid_argument("stream mode must be raw, low, high, reverse, or nearby");
    const unsigned width = (mode=="low" || mode=="high") ? 4U : 8U;
    if (bytes % width != 0) throw std::invalid_argument("byte count must be a multiple of stream word size");
#ifdef _WIN32
    if (_setmode(_fileno(stdout), _O_BINARY) == -1) throw std::runtime_error("cannot set binary stdout");
#endif
    ratboy::Ratchet4 rng(s0,s1);
    std::array<char, 65536> buffer{};
    U64 index=0;
    while (bytes) {
        const auto chunk=static_cast<std::size_t>(std::min<U64>(bytes, buffer.size()));
        for (std::size_t pos=0; pos<chunk; pos+=width) {
            U64 word;
            if (mode=="nearby") { ratboy::Ratchet4 seeded(s0+index++,s1); word=seeded.next(); }
            else word=rng.next();
            if (mode=="high") word >>= 32;
            if (mode=="reverse") word=reversed(word);
            for (unsigned j=0; j<width; ++j) buffer[pos+j]=static_cast<char>((word >> (8*j)) & 255);
        }
        std::cout.write(buffer.data(), static_cast<std::streamsize>(chunk));
        if (!std::cout) throw std::runtime_error("binary output write failed");
        bytes-=chunk;
    }
}

int main(int argc, char** argv) {
    try {
        if (argc==1) { interactive(); return 0; }
        const std::string command=argv[1];
        if (command=="--help" || command=="help") {
            std::cout << "Ratchet-4 V1 experimental PRNG\n"
                << "Research prototype: statistical review unresolved.\n"
                << "No arguments: interactive table-selection demo\n"
                << "demo COUNT SEED0 SEED1\nraw COUNT SEED0 SEED1\n"
                << "bounded COUNT SEED0 SEED1 BOUND\n"
                << "stream BYTES SEED0 SEED1 [raw|low|high|reverse|nearby]\n"
                << "Integers: unsigned decimal or 0x hexadecimal.\n"
                << "nearby is a seeding diagnostic, not the gameplay path.\n";
            return 0;
        }
        const bool simple=(command=="demo" || command=="raw");
        if (!(simple && argc==5) && !(command=="bounded" && argc==6)
            && !(command=="stream" && (argc==5 || argc==6)))
            throw std::invalid_argument("invalid command or argument count; use --help");
        const U64 count=parse_u64(argv[2]), s0=parse_u64(argv[3]), s1=parse_u64(argv[4]);
        if (command=="stream") { stream(count,s0,s1,argc==6 ? argv[5] : "raw"); return 0; }
        if (count>1000000) throw std::invalid_argument("text count is limited to 1000000; use stream for bulk data");
        ratboy::Ratchet4 rng(s0,s1);
        if (command=="demo") draws(rng,count);
        else if (command=="raw") {
            for (U64 i=0;i<count;++i) std::cout << "0x" << std::hex << std::setfill('0') << std::setw(16) << rng.next() << '\n';
        } else {
            const U64 bound=parse_u64(argv[5]);
            if (bound==0) throw std::invalid_argument("bound must be positive");
            for (U64 i=0;i<count;++i) std::cout << rng.bounded(bound) << '\n';
        }
        return 0;
    } catch (const std::exception& e) { std::cerr << "Error: " << e.what() << '\n'; return 2; }
}
