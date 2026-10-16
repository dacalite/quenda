# Estado dos requisitos

Trazabilidade entre os requisitos oficiais do reto e o prototipo. Actualízase ao pechar cada fase.

Lenda: ✅ feito · 🟡 en curso · ⬜ pendente

Última actualización: fase 2 (15/10/2026).

## Cidadanía

| Requisito                  | Estado | Onde se ve                                                                                                                                         |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de instalacións   | ✅     | Listado con busca e filtros (tipo, día, franxa, accesibilidade física, libre na próxima hora); ficha con accesibilidade, normas, tarifas e horario |
| Reserva en liña            | ✅     | Dispoñibilidade por tramos e por semana, recomendación horaria, revisión con prezo e normas, confirmación con QR e .ics                            |
| Modificación e cancelación | ✅     | «As miñas reservas» e detalle da reserva: cambiar a hora respectando as regras e cancelar coa política de prazos visible                           |
| Historial e avisos         | ✅     | Lapela de historial con «Repetir»; centro de avisos con avisos do concello e recolocación; preferencias de canle                                   |

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

| Requisito                                     | Estado | Onde se ve                                                                                                                                                                                          |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Software libre con licenza OSI/FSF (EUPL-1.2) | ✅     | `LICENSE`, cabeceiras SPDX comprobadas en CI, `npm run licenses` (ADR 0002)                                                                                                                         |
| Arquitectura aberta: web responsive e modular | 🟡     | Estrutura por capas en `src/`; reflow a 320 px comprobado en e2e                                                                                                                                    |
| Interoperabilidade e estándares abertos       | 🟡     | iCalendar (RFC 5545) para descargar reservas e subscrición simulada; acceso simulado con Cl@ve e Chave365 (SAML 2.0 / OIDC); exportación dos datos persoais en JSON                                 |
| RXPD e xestión segura de usuarios             | 🟡     | Cada persoa só accede ás súas reservas, perfil e avisos (comprobado en tests); DNI enmascarado; descarga e eliminación de datos (simulada); ningunha chamada a servizos externos                    |
| Accesibilidade                                | 🟡     | Compoñentes con tests de axe; React Aria e Intl en galego (ADR 0003 e 0004); reserva e cancelación completas só co teclado, con axe en cada paso; alto contraste, texto grande e movemento reducido |

## Valorables

| Requisito                                            | Estado | Onde se ve                                                                                                                    |
| ---------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| App móbil: PWA instalable                            | ✅     | Manifest con iconos, instalable e funcionando sen conexión (interface e datos locais)                                         |
| Calendarios persoais: exportación .ics e subscrición | ✅     | Botón «Engadir ao calendario» en cada reserva e páxina «Calendario persoal» con descarga e enderezo de subscrición (simulado) |
| Acceso mediante código QR                            | 🟡     | QR e código lexible en cada reserva; a validación na entrada chega na fase 3                                                  |
| Analítica de uso e recomendación horaria             | 🟡     | Recomendación explicable de horas con pouca ocupación; os indicadores do concello chegan na fase 3                            |
