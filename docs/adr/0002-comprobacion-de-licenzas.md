# ADR 0002 — Comprobación automática das licenzas das dependencias

- Estado: aceptada
- Data: 15/10/2026

## Contexto

O plan esixe que todas as dependencias teñan licenzas aprobadas pola OSI e que `npm run licenses` falle se non é así. O paquete `license-checker`, o máis coñecido, leva anos sen mantemento.

## Decisión

- Usar `license-checker-rseidelsohn` (BSD-3-Clause), o fork mantido. Fíxase na versión 4 porque a 5 esixe Node.js 24 e o proxecto admite Node.js 22.
- A lista permitida contén só as licenzas que aparecen hoxe na árbore de dependencias: MIT, MIT-0, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, 0BSD, MPL-2.0, BlueOak-1.0.0, OFL-1.1, CC0-1.0 e EUPL-1.2.
- CC0-1.0 é unha cesión ao dominio público recoñecida como libre pola FSF, aínda que non está aprobada pola OSI. Só a usan paquetes de datos das ferramentas de desenvolvemento (`mdn-data`, `language-subtag-registry` e `spdx-license-ids`).
- Exclúense **por nome** tres paquetes de datos con licenzas Creative Commons de atribución, que son libres pero non son licenzas de software:
  - `caniuse-lite` (CC-BY-4.0), que chega a través de `eslint-plugin-react-hooks`;
  - `spdx-exceptions` (CC-BY-3.0) e `spdx-ranges` (MIT e CC-BY-3.0), que chegan a través do propio comprobador.

## Consecuencias

- O código que se distribúe ao navegador só usa MIT, Apache-2.0 e OFL-1.1.
- A integración continua falla se entra calquera paquete cunha licenza fóra da lista. Como a exclusión é por nome e non por licenza, un paquete de código novo con CC-BY tamén faría fallar a comprobación.
- Ao engadir unha dependencia que traia unha licenza nova, hai que revisala e ampliar a lista neste ADR.
