# Kubb — hagespill

Et nettleserspill laget med HTML, CSS og JavaScript, uten byggeprosess eller pakkeavhengigheter.

## Kjør lokalt

Fra repoets rot:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Åpne serveren i nettleseren. Spillet kan også åpnes direkte via `index.html` eller publiseres på en statisk webvert.

## Spilleregler

Velg retning ved å trykke på banen eller bruke skyveknappen. Juster kraften og kast. Hvert lag får tre kast per tur. Fell motstanderens fem kubber, deretter kongen. Treff på kongen før kubbene er felt gir tap. Datamaskinen spiller automatisk. Lange kast flyr over kongen; bruk omtrent 40 % kraft og rett retning for å felle den.

Dette er en forenklet kubbvariant uten innkast av feltkubber. Treff avgjøres av pinnens bane ovenfra; det simuleres ikke tredimensjonal fysikk. Nettfonter er valgfrie; systemfonter brukes uten internettilgang.
