@echo off
setlocal
set "PRNG_NATIVE_EXE=%~dp0bin\windows-x64\ratchet4.exe"
if not exist "%PRNG_NATIVE_EXE%" (
  echo The native demo was not found at:
  echo "%PRNG_NATIVE_EXE%"
  echo Extract the complete original review ZIP before using this launcher.
  echo For the browser interface, open P-RNG-Lab.html normally in Edge or Chrome.
  pause
  exit /b 2
)
"%PRNG_NATIVE_EXE%"
set "PRNG_NATIVE_EXIT=%ERRORLEVEL%"
if not "%PRNG_NATIVE_EXIT%"=="0" (
  echo The native demo exited with code %PRNG_NATIVE_EXIT%.
  echo If Windows blocked this unsigned executable, use P-RNG-Lab.html.
  echo Running as administrator is not required.
  pause
)
exit /b %PRNG_NATIVE_EXIT%
