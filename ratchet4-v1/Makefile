# SPDX-License-Identifier: 0BSD
CXX ?= g++
PYTHON ?= python3
BUILD ?= /tmp/ratchet4-v1-build
CXXFLAGS ?= -O3 -std=c++17 -Wall -Wextra -Wpedantic -Wconversion -Werror
CPPFLAGS += -Iinclude
PROGRAMS = $(BUILD)/ratchet4 $(BUILD)/test_engine $(BUILD)/benchmark $(BUILD)/seed_probe

.PHONY: all test bench diagnostics windows
all: $(PROGRAMS)

$(BUILD):
	mkdir -p "$(BUILD)"

$(BUILD)/ratchet4: src/main.cpp src/cli.hpp include/ratchet4.hpp | $(BUILD)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) src/main.cpp -o "$@"

$(BUILD)/test_engine: tests/test_engine.cpp src/cli.hpp include/ratchet4.hpp | $(BUILD)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) tests/test_engine.cpp -o "$@"

$(BUILD)/benchmark: src/benchmark.cpp src/cli.hpp include/ratchet4.hpp | $(BUILD)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) src/benchmark.cpp -o "$@"

$(BUILD)/seed_probe: tests/seed_probe.cpp src/cli.hpp include/ratchet4.hpp | $(BUILD)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) tests/seed_probe.cpp -o "$@"

test: all
	"$(BUILD)/test_engine"
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) tests/verify_reference.py "$(BUILD)/ratchet4"
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) tests/reduced_cycles.py

bench: $(BUILD)/benchmark
	"$(BUILD)/benchmark"

diagnostics: all
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) tests/diagnostics.py "$(BUILD)/ratchet4" "$(BUILD)/seed_probe" "$(BUILD)/diagnostics.json"

windows:
	mkdir -p bin/windows-x64
	x86_64-w64-mingw32-g++ $(CPPFLAGS) $(CXXFLAGS) -static src/main.cpp -o bin/windows-x64/ratchet4.exe
