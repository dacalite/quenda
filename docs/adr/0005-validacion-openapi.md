# ADR 0005 — Validación da especificación OpenAPI con Redocly CLI

- Estado: aceptada
- Data: 16/10/2026

## Contexto

A API do sistema completo descríbese en `docs/api/openapi.yaml` (OpenAPI 3.1) e ten que coincidir cos portos de `src/data/ports`. Unha especificación que non se valida deixa de ser fiable axiña, así que fai falta unha ferramenta libre que a comprobe en local e na integración continua.

Valoráronse tres opcións:

| Ferramenta                            | Licenza    | Peso                                  | Que comproba                                                                       |
| ------------------------------------- | ---------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| `@redocly/cli`                        | MIT        | Un paquete sen dependencias (≈ 11 MB) | Estrutura OpenAPI 3.1 e boas prácticas: referencias, `operationId`, rutas ambiguas |
| `@seriousme/openapi-schema-validator` | MIT        | 9 paquetes (≈ 2,3 MB)                 | Só a estrutura, contra o esquema oficial                                           |
| `@stoplight/spectral-cli`             | Apache-2.0 | 242 paquetes                          | Estrutura e regras configurables                                                   |

## Decisión

- Usar `@redocly/cli` co conxunto de regras `recommended` (`redocly.yaml`) e o script `npm run api:lint`, que tamén se executa na integración continua.
- Desactivar a telemetría da ferramenta (`telemetry: off`) para que non envíe datos de uso.
- Descartar Spectral porque trae un paquete sen licenza declarada e tres coa licenza Unlicense, que fan fallar `npm run licenses`.

## Consecuencias

- A especificación non pode ter referencias rotas nin rutas ambiguas; as regras recomendadas detectaron dúas que se corrixiron antes de publicala.
- Como o paquete leva as súas dependencias empaquetadas, `npm run licenses` só ve a licenza MIT do paquete. É unha ferramenta de desenvolvemento e non chega ao navegador.
- Calquera cambio nos portos debe reflectirse na especificación e no adaptador HTTP (`src/data/adapters/http`).
