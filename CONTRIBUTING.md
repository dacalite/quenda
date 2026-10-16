# Guía para contribuír

Grazas por querer mellorar Quenda. Esta guía explica como propoñer cambios e que se comproba en cada un.

## Antes de empezar

- Para erros e propostas, abre unha _issue_ describindo o problema ou a necesidade. Nos erros, indica os pasos para reproducilo, o navegador e, se é de accesibilidade, a tecnoloxía de apoio (lector de pantalla e versión).
- Para cambios grandes (unha dependencia nova, unha mudanza na arquitectura ou unha funcionalidade nova), comenta primeiro a idea nunha _issue_.
- As vulnerabilidades de seguridade non se publican nunha _issue_: usa a opción «Report a vulnerability» da pestana _Security_ do repositorio.

## Preparar o contorno

Precisa Node.js 22 ou superior.

```sh
npm ci
npx playwright install --with-deps chromium
npm run dev
```

## Como traballar

1. Crea unha rama a partir de `main`.
2. Fai commits pequenos e descritivos seguindo [Conventional Commits](https://www.conventionalcommits.org/), coa descrición en galego: `feat(citizen): repetir unha reserva pasada`.
3. Antes de cada commit, comproba que todo está en verde:

   ```sh
   npm run lint
   npm run typecheck
   npm test
   npm run e2e
   ```

4. Abre unha _pull request_ contra `main` explicando que cambia, por que e como probalo. A integración continua repite as comprobacións e ademais valida as licenzas, a especificación OpenAPI e a compilación.

## Convencións

- **Idiomas.** Identificadores, comentarios e nomes de tests en inglés; documentación (`README.md`, `docs/`) en galego.
- **Textos da interface** só en `src/i18n/gl` e `src/i18n/es`, nunca escritos nos compoñentes. As claves están tipadas e un test comproba que os dous idiomas teñen as mesmas.
- **Licenza.** Cada ficheiro fonte comeza coa cabeceira `SPDX-License-Identifier: EUPL-1.2`.
- **Estilos** con CSS Modules e as variables de `src/ui/tokens.css`, sen frameworks CSS.
- **Datos** sempre a través dos portos (`src/data/ports`), acoutados por concello. As regras de negocio van en `src/domain` como funcións puras, cos seus tests.
- **Comentarios** só para explicar o porqué que o código non di.

## Accesibilidade

Cada compoñente e cada pantalla nace accesible e co seu test:

- HTML semántico, un único `h1` por vista e etiquetas visibles en todos os campos.
- Todo usable co teclado, con foco visible; os diálogos pechan con Escape e devolven o foco.
- Contraste de 4,5:1 para o texto e 3:1 para os compoñentes; a cor nunca é o único medio.
- Obxectivos táctiles de polo menos 44 × 44 px; sen desprazamento horizontal a 320 px.
- As pantallas novas engádense aos tests e2e con `expectNoAxeViolations`, que falla con calquera infracción.
- Nada de superposicións nin _widgets_ de accesibilidade.

Os criterios completos están en [docs/accesibilidade/criterios.md](docs/accesibilidade/criterios.md).

## Dependencias

- Só licenzas aprobadas pola OSI; `npm run licenses` comproba a árbore enteira ([ADR 0002](docs/adr/0002-comprobacion-de-licenzas.md)).
- Ningunha chamada a servizos externos ao usar a aplicación: nin CDN, nin fontes externas, nin analítica, nin mapas de terceiros.
- Unha dependencia nova necesita un ADR curto en `docs/adr` co contexto, a decisión e as consecuencias.

## Código de conduta

Ao participar comprométeste a respectar o [código de conduta](CODE_OF_CONDUCT.md).
