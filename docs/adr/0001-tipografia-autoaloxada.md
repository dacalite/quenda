# ADR 0001 — Atkinson Hyperlegible Next autoaloxada con Fontsource

- Estado: aceptada
- Data: 15/10/2026

## Contexto

O plan fixa a tipografía Atkinson Hyperlegible, deseñada polo Braille Institute para persoas con baixa visión, servida desde o propio despregamento: nada de Google Fonts nin CDN. En 2025 publicouse Atkinson Hyperlegible Next, que amplía os pesos e o xogo de caracteres e mantén os mesmos criterios de lexibilidade.

## Decisión

Usar Atkinson Hyperlegible Next a través do paquete `@fontsource/atkinson-hyperlegible-next` (OFL-1.1). O paquete trae as fontes en woff2 e woff, divididas en subconxuntos (`latin`, `latin-ext`) con `unicode-range`, e Vite cópiaas ao build. Cárganse os pesos 400 e 700.

## Consecuencias

- Ningunha petición externa. A licenza OFL queda rexistrada nos metadatos de npm e pasa `npm run licenses`.
- Engade unha dependencia de execución que só contén CSS e fontes, sen JavaScript.
- Alternativa descartada: copiar os ficheiros ao repositorio a man, que obriga a manter a licenza e as actualizacións sen axuda de ningunha ferramenta.
