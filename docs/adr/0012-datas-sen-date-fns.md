# ADR 0012 — Datas e horas sen date-fns

- Estado: aceptada
- Data: 16/10/2026

## Contexto

O deseño inicial contemplaba date-fns, cos seus locales galego e castelán, para calcular e formatear datas. O dominio traballa con datas do calendario do concello (`YYYY-MM-DD`) e horas locais (`HH:mm`) en texto, non con instantes, para que unha reserva das 18:00 sexa sempre ás 18:00 na zona horaria do concello, abra quen abra a aplicación.

## Decisión

- **Cálculo:** funcións propias e pequenas en `src/domain/time.ts` (sumar días, día da semana, inicio da semana, minutos, data e hora actuais na zona do concello), con tests e sen dependencias, porque operan sobre texto e non sobre obxectos `Date`.
- **Formato:** a API `Intl` do navegador, coa que i18next e React Aria xa contan, completada para o galego en Chrome ([ADR 0004](0004-intl-en-galego.md)).
- **Selectores de data:** `@internationalized/date`, que usa React Aria.

## Consecuencias

- O dominio pode executarse igual no servidor e no navegador, sen dependencias.
- Unha biblioteca menos e un único sistema de formato para todos os textos.
- Os cambios de hora (horario de verán) tratan as horas como locais; o desfase dunha hora nos días de cambio é un caso límite aceptado.
