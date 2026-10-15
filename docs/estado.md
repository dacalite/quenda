# Estado dos requisitos

Trazabilidade entre os requisitos oficiais do reto e o prototipo. Actualízase ao pechar cada fase.

Lenda: ✅ feito · 🟡 en curso · ⬜ pendente

Última actualización: fase 0 (15/10/2026).

## Cidadanía

| Requisito                  | Estado | Onde se ve |
| -------------------------- | ------ | ---------- |
| Consulta de instalacións   | ⬜     |            |
| Reserva en liña            | ⬜     |            |
| Modificación e cancelación | ⬜     |            |
| Historial e avisos         | ⬜     |            |

## Concello

| Requisito                                             | Estado | Onde se ve |
| ----------------------------------------------------- | ------ | ---------- |
| Alta e mantemento de instalacións                     | ⬜     |            |
| Xestión de horarios e normas de uso                   | ⬜     |            |
| Información e seguimento mediante indicadores básicos | ⬜     |            |

## Reutilización pública

| Requisito                         | Estado | Onde se ve                                                                       |
| --------------------------------- | ------ | -------------------------------------------------------------------------------- |
| Solución replicable e escalable   | 🟡     | Build estático despregable en calquera hosting (`BASE_PATH` en `vite.config.ts`) |
| Configurable por cada municipio   | ⬜     |                                                                                  |
| Preparada para uso multimunicipio | ⬜     |                                                                                  |

## Condicionantes técnicos obrigatorios

| Requisito                                     | Estado | Onde se ve                                                                                            |
| --------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Software libre con licenza OSI/FSF (EUPL-1.2) | ✅     | `LICENSE`, cabeceiras SPDX comprobadas en CI, `npm run licenses` (ADR 0002)                           |
| Arquitectura aberta: web responsive e modular | 🟡     | Estrutura por capas en `src/`; reflow a 320 px comprobado en e2e                                      |
| Interoperabilidade e estándares abertos       | ⬜     |                                                                                                       |
| RXPD e xestión segura de usuarios             | ⬜     |                                                                                                       |
| Accesibilidade                                | 🟡     | Salto ao contido, `lang` dinámico, foco visible, tipografía Atkinson Hyperlegible; axe en CI (`e2e/`) |

## Valorables

| Requisito                                            | Estado | Onde se ve |
| ---------------------------------------------------- | ------ | ---------- |
| App móbil: PWA instalable                            | ⬜     |            |
| Calendarios persoais: exportación .ics e subscrición | ⬜     |            |
| Acceso mediante código QR                            | ⬜     |            |
| Analítica de uso e recomendación horaria             | ⬜     |            |
