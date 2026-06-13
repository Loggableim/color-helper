@echo off
REM color-helper.com DNS-Diagnostik fuer Windows
echo === Aktuelle DNS-Records (was Windows sieht) ===
echo.
echo --- color-helper.com (A) ---
nslookup -type=A color-helper.com
echo.
echo --- www.color-helper.com (A) ---
nslookup -type=A www.color-helper.com
echo.
echo --- NS-Records (wer ist authoritativ) ---
nslookup -type=NS color-helper.com
echo.
echo --- Welcher Resolver ist aktiv? ---
ipconfig /all | findstr /C:"DNS Servers" /C:"DNS Server"
echo.
echo --- Windows DNS-Cache leeren ---
ipconfig /flushdns
echo.
echo === danach nochmal testen ===
nslookup -type=A color-helper.com
echo.
pause
