@echo off
rem SPDX-License-Identifier: 0BSD
setlocal
cd /d "%~dp0"
where cl >nul 2>nul
if errorlevel 1 (
  echo Open an x64 Native Tools Command Prompt for Visual Studio, then run this file.
  exit /b 1
)
set "RATCHET_BUILD=%TEMP%\ratchet4-v1-build"
if not exist "%RATCHET_BUILD%" mkdir "%RATCHET_BUILD%"
if not exist "bin\windows-x64" mkdir "bin\windows-x64"
cl /nologo /std:c++17 /O2 /W4 /EHsc /Iinclude src\main.cpp /Fo"%RATCHET_BUILD%\main.obj" /Fe"bin\windows-x64\ratchet4.exe"
if errorlevel 1 exit /b 1
cl /nologo /std:c++17 /O2 /W4 /EHsc /Iinclude tests\test_engine.cpp /Fo"%RATCHET_BUILD%\tests.obj" /Fe"%RATCHET_BUILD%\test_engine.exe"
if errorlevel 1 exit /b 1
"%RATCHET_BUILD%\test_engine.exe"
if errorlevel 1 exit /b 1
set "PYTHONDONTWRITEBYTECODE=1"
py -3 tests\verify_reference.py bin\windows-x64\ratchet4.exe
if errorlevel 1 exit /b 1
py -3 tests\reduced_cycles.py
exit /b %errorlevel%
