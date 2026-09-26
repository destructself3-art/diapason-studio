@echo off
cd /d "%~dp0"
start "" http://localhost:5178
node serve.mjs 5178
