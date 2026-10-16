# Estado dos requisitos

Trazabilidade entre os requisitos oficiais do reto e o prototipo. Actualízase ao pechar cada fase.

Lenda: ✅ feito · 🟡 en curso · ⬜ pendente

Última actualización: fase 3 (16/10/2026).

## Cidadanía

| Requisito                  | Estado | Onde se ve                                                                                                                                         |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de instalacións   | ✅     | Listado con busca e filtros (tipo, día, franxa, accesibilidade física, libre na próxima hora); ficha con accesibilidade, normas, tarifas e horario |
| Reserva en liña            | ✅     | Dispoñibilidade por tramos e por semana, recomendación horaria, revisión con prezo e normas, confirmación con QR e .ics                            |
| Modificación e cancelación | ✅     | «As miñas reservas» e detalle da reserva: cambiar a hora respectando as regras e cancelar coa política de prazos visible                           |
| Historial e avisos         | ✅     | Lapela de historial con «Repetir»; centro de avisos con avisos do concello e recolocación; preferencias de canle                                   |

## Concello

| Requisito                                             | Estado | Onde se ve                                                                                                                                                                                                                                           |
| ----------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alta e mantemento de instalacións                     | ✅     | «Instalacións»: alta, edición e baixa (inactiva) con espazos reservables, accesibilidade física, normas de uso e tarifas; validación igual á do servidor e resumo de erros                                                                           |
| Xestión de horarios e normas de uso                   | ✅     | Horario semanal por tramos, excepcións por data e festivos do concello; normas xerais en «Configuración» que cada instalación pode sobrescribir; bloqueos que cancelan e avisan ás persoas afectadas; reservas de tempada con detección de conflitos |
| Información e seguimento mediante indicadores básicos | ✅     | Panel do día; «Indicadores» con ocupación por instalación e por día e hora, horas con pouca demanda, cancelacións, non presentadas e reparto por canle e por tipo de uso, cada un con táboa, resumo en texto e CSV                                   |

## Reutilización pública

| Requisito                         | Estado | Onde se ve                                                                                                                                                        |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solución replicable e escalable   | 🟡     | Build estático despregable en calquera hosting (`BASE_PATH` en `vite.config.ts`); acceso a datos tras portos con forma de API REST (`src/data/ports`)             |
| Configurable por cada municipio   | ✅     | «Configuración» sen código: nome, escudo, cor corporativa coa comprobación de contraste e unha variante accesible, idiomas activos, textos legais e normas xerais |
| Preparada para uso multimunicipio | 🟡     | Rutas por concello (`/bouzalonga`, `/ribasmeiras`); todos os datos acoutados por concello, cun test que demostra que non hai fugas                                |

## Condicionantes técnicos obrigatorios

| Requisito                                     | Estado | Onde se ve                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Software libre con licenza OSI/FSF (EUPL-1.2) | ✅     | `LICENSE`, cabeceiras SPDX comprobadas en CI, `npm run licenses` (ADR 0002)                                                                                                                                                                                                                             |
| Arquitectura aberta: web responsive e modular | 🟡     | Estrutura por capas en `src/`; reflow a 320 px comprobado en e2e                                                                                                                                                                                                                                        |
| Interoperabilidade e estándares abertos       | 🟡     | iCalendar (RFC 5545) para descargar reservas e subscrición simulada; acceso simulado con Cl@ve e Chave365 (SAML 2.0 / OIDC); exportación dos datos persoais en JSON; indicadores e reservas en CSV (RFC 4180)                                                                                           |
| RXPD e xestión segura de usuarios             | 🟡     | Cada persoa só accede ás súas reservas, perfil e avisos; a conserxería opera e só a administración configura ou le o rexistro de actividade (comprobado en tests); DNI enmascarado; descarga e eliminación de datos (simulada); exportación de reservas sen nomes; ningunha chamada a servizos externos |
| Accesibilidade                                | 🟡     | Compoñentes con tests de axe; React Aria e Intl en galego (ADR 0003 e 0004); reserva e cancelación completas só co teclado, con axe en cada paso; axe en todas as pantallas do concello; gráficas que son táboas con resumo en texto; alto contraste, texto grande e movemento reducido                 |

## Valorables

| Requisito                                            | Estado | Onde se ve                                                                                                                                                                                               |
| ---------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App móbil: PWA instalable                            | ✅     | Manifest con iconos, instalable e funcionando sen conexión (interface e datos locais)                                                                                                                    |
| Calendarios persoais: exportación .ics e subscrición | ✅     | Botón «Engadir ao calendario» en cada reserva e páxina «Calendario persoal» con descarga e enderezo de subscrición (simulado)                                                                            |
| Acceso mediante código QR                            | ✅     | QR e código lexible en cada reserva; «Control de acceso» le o QR coa cámara se o navegador ten BarcodeDetector ou admite o código escrito, rexistra a entrada e, ao rematar a franxa, as non presentadas |
| Analítica de uso e recomendación horaria             | ✅     | Recomendación explicable de horas con pouca ocupación para a cidadanía; indicadores do concello con mapa de calor, horas tranquilas e exportación CSV                                                    |
