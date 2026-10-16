# ADR 0008 — Varios concellos nunha instancia, illados por fila

- Estado: aceptada
- Data: 16/10/2026

## Contexto

Unha deputación debe poder ofrecer o servizo a moitos concellos pequenos desde unha soa instalación, e un concello debe poder ter a súa propia. Os datos de cada concello non poden verse nunca desde outro.

Hai tres opcións habituais: unha base de datos por concello, un esquema por concello ou unha base de datos compartida con illamento por fila.

## Decisión

- Unha base de datos compartida en PostgreSQL na que todas as táboas dun concello levan `tenant_id`, coa **seguridade por fila (RLS)** activada e forzada: cada transacción fixa o concello da petición e a base de datos filtra todas as consultas.
- As claves foráneas inclúen o concello para que ningunha relación cruce de concello.
- Unha instancia propia dun concello é o mesmo sistema cun só concello.
- No prototipo, todos os portos reciben o concello en cada chamada e o adaptador local acouta cada consulta. Un test demostra que non hai fugas entre concellos.

O detalle está no [modelo de datos](../arquitectura/modelo-datos.md#illamento-entre-concellos).

## Consecuencias

- Dar de alta un concello é crear unhas filas, sen despregar nada: a deputación faino en quente desde a súa vista.
- Unha soa base de datos que manter, migrar e copiar, aínda que haxa centos de concellos.
- O illamento non depende só do código da API: un erro nunha consulta non expón datos doutro concello.
- Exportar os datos dun concello para levalos a unha instancia propia é unha consulta filtrada por `tenant_id`.
- Un concello moi grande pode compartir recursos con outros pequenos; se fose un problema, pode pasar á súa propia instancia.
