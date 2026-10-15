# Estado dos requisitos

Trazabilidade entre os requisitos oficiais do reto e o prototipo. Actualízase ao pechar cada fase.

Lenda: ✅ feito · 🟡 en curso · ⬜ pendente

Última actualización: fase 1 (15/10/2026).

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

| Requisito                         | Estado | Onde se ve                                                                                                                                            |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solución replicable e escalable   | 🟡     | Build estático despregable en calquera hosting (`BASE_PATH` en `vite.config.ts`); acceso a datos tras portos con forma de API REST (`src/data/ports`) |
| Configurable por cada municipio   | 🟡     | Cada concello ten o seu nome, escudo, cor (con contraste verificado) e normas por defecto; cambio de concello na barra de demostración                |
| Preparada para uso multimunicipio | 🟡     | Rutas por concello (`/bouzalonga`, `/ribasmeiras`); todos os datos acoutados por concello, cun test que demostra que non hai fugas                    |

## Condicionantes técnicos obrigatorios

| Requisito                                     | Estado | Onde se ve                                                                                                                                                                                                                      |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Software libre con licenza OSI/FSF (EUPL-1.2) | ✅     | `LICENSE`, cabeceiras SPDX comprobadas en CI, `npm run licenses` (ADR 0002)                                                                                                                                                     |
| Arquitectura aberta: web responsive e modular | 🟡     | Estrutura por capas en `src/`; reflow a 320 px comprobado en e2e                                                                                                                                                                |
| Interoperabilidade e estándares abertos       | ⬜     |                                                                                                                                                                                                                                 |
| RXPD e xestión segura de usuarios             | ⬜     |                                                                                                                                                                                                                                 |
| Accesibilidade                                | 🟡     | Sistema de compoñentes sobre React Aria con tests de axe; textos de React Aria en galego (ADR 0003); foco e título ao navegar; alto contraste, texto grande e movemento reducido; axe en todas as vistas, en móbil e escritorio |

## Valorables

| Requisito                                            | Estado | Onde se ve |
| ---------------------------------------------------- | ------ | ---------- |
| App móbil: PWA instalable                            | ⬜     |            |
| Calendarios persoais: exportación .ics e subscrición | ⬜     |            |
| Acceso mediante código QR                            | ⬜     |            |
| Analítica de uso e recomendación horaria             | ⬜     |            |
