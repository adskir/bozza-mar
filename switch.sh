#!/bin/sh
# Uso: ./switch.sh original  -> pubblica la copia della versione Tilda di Mar (cartella original/)
#      ./switch.sh nuovo     -> pubblica il sito nuovo (Eleventy, _site)
if [ "$1" = "original" ]; then
  printf '[build]\n  command = "echo versione originale"\n  publish = "original"\n' > netlify.toml
else
  printf '[build]\n  command = "npm run build"\n  publish = "_site"\n' > netlify.toml
fi
cat netlify.toml
