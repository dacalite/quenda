# ADR 0009 — Prototipo con adaptador local e arquitectura real

- Estado: aceptada
- Data: 16/10/2026

## Contexto

O prototipo ten que funcionar de verdade para quen o proba (reservar, cancelar, xestionar instalacións, dar de alta concellos) e publicarse nunha URL sen servidor. Ao mesmo tempo, debe demostrar como sería o sistema completo e non quedar nunha maqueta que haxa que tirar.

## Decisión

- O prototipo é só a parte do navegador. Todo o acceso a datos pasa por **portos** asíncronos (`src/data/ports`) coa mesma forma que a API REST: acoutados por concello e con erros tipados equivalentes aos códigos HTTP (400, 403, 404, 409 e 422).
- Un **adaptador local** (`src/data/adapters/local`) implementa os portos sobre `localStorage` e simula o servidor: latencia de 150 a 400 ms, permisos por rol, validación, rexistro de actividade e avisos.
- Os datos de demostración xéranse cunha semente determinista, idénticos tras cada reinicio, e renóvanse se teñen máis de sete días. A xeración faise nun _worker_ para que a primeira visita non bloquee a páxina nun móbil lento.
- Un **adaptador HTTP** (`src/data/adapters/http`) implementa os mesmos portos sobre a API descrita en `docs/api/openapi.yaml`.
- As regras de negocio (`src/domain`) son funcións puras que pode executar tamén o servidor.

## Consecuencias

- O prototipo publícase como sitio estático, funciona sen conexión e non garda nada fóra do navegador.
- Os estados de carga e de erro existen e vense, porque as chamadas son asíncronas e poden fallar como fallaría a API.
- Pasar ao sistema real é cambiar de adaptador, sen tocar as pantallas; o servidor reutiliza o dominio.
- O adaptador local confía no navegador: é unha simulación para a demostración, non unha medida de seguridade.
