# ADR 0006 — Licenza EUPL-1.2

- Estado: aceptada
- Data: 16/10/2026

## Contexto

O código ten que publicarse cunha licenza libre recoñecida pola OSI e pola FSF, e debe poder reutilizalo calquera administración. Interesa ademais que as melloras que fagan terceiros sobre o servizo volvan ao común, tamén cando o software se usa a través da rede e non se distribúe.

## Decisión

- Publicar o código baixo a **Licenza Pública da Unión Europea, versión 1.2** (EUPL-1.2). O ficheiro `LICENSE` leva o texto oficial en inglés, que é a versión canónica.
- Cada ficheiro fonte leva a cabeceira `SPDX-License-Identifier: EUPL-1.2`, que comproba `npm run lint`.
- As dependencias só poden ter licenzas aprobadas pola OSI ([ADR 0002](0002-comprobacion-de-licenzas.md)).

## Consecuencias

- É a licenza que promove a Comisión Europea para o software das administracións, con versións oficiais nas linguas da UE, incluído o castelán, e validez xurídica en todos os Estados membros.
- É _copyleft_ e cobre o uso a través da rede: quen ofreza unha versión modificada como servizo ten que publicar os seus cambios.
- É compatible con outras licenzas libres habituais (GPL, AGPL, LGPL, MPL, entre outras), o que facilita combinar o código con outros proxectos públicos.
