#!/bin/bash
# Obalí index.html (zdroj pro náhled v Claude) do plné HTML stránky pro GitHub Pages.
cd "$(dirname "$0")"
{ echo '<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}img{max-width:100%}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style>'
  cat index.html | sed '0,/<\/style>/s//<\/style><\/head><body>/'
  echo '</body></html>'; } > docs/index.html
mkdir -p docs/img && cp img/*.webp docs/img/
