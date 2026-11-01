#!/usr/bin/env python3
# SPDX-License-Identifier: LicenseRef-Ratchet-Required-1.0
"""One-command portable CMake build and contract test; requires C++17 and CMake."""
import pathlib,subprocess,tempfile
root=pathlib.Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='strap-native-') as temp:
    subprocess.run(['cmake','-S',str(root),'-B',temp,'-DCMAKE_BUILD_TYPE=Release'],check=True)
    subprocess.run(['cmake','--build',temp,'--config','Release','--parallel','2'],check=True)
    subprocess.run(['ctest','-C','Release','--output-on-failure'],cwd=temp,check=True)
