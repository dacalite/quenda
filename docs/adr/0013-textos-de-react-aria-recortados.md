# ADR 0013 — Só os textos de React Aria que usa a aplicación

- Estado: aceptada
- Data: 17/10/2026

## Contexto

Cada paquete de React Aria inclúe os seus textos internos en 34 idiomas. A aplicación só usa os de castelán: o galego constrúese sobre eles no dicionario global (ADR 0003). O resto viaxa no paquete de JavaScript sen usarse nunca, e parte del vai no código que se descarga ao abrir calquera pantalla, o que penaliza a primeira carga no móbil.

React Aria publica un complemento de compilación que deixa só os idiomas indicados: `@react-aria/optimize-locales-plugin` (Apache-2.0, do mesmo proxecto, cunha única dependencia: `unplugin`, MIT).

## Decisión

- Usar o complemento en `vite.config.ts`, antes dos demais, con `locales: ['es-ES']`.
- Non engadir o galego á lista: React Aria non o trae, e os seus textos seguen chegando desde `src/i18n/reactAria.ts`.

## Consecuencias

- O JavaScript comprimido baixa uns 22 KB en total; 5,5 KB deles no código común que carga toda pantalla. Na medición con Lighthouse en móbil a mellora queda dentro da variación entre execucións: axuda, pero non resolve por si soa a primeira carga.
- O paquete non declara licenza no `package.json`; o ficheiro `LICENSE` é Apache-2.0 e `npm run licenses` acéptao. É unha ferramenta de compilación e non chega ao navegador.
- Se algún día se ofrece outro idioma que React Aria traia (por exemplo, inglés), hai que engadilo á lista ou os seus textos internos sairán en castelán.
- Os tests e2e pasan tanto co servidor de desenvolvemento coma coa compilación de produción.
