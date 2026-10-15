# ADR 0003 — Textos internos de React Aria en galego

- Estado: aceptada
- Data: 15/10/2026

## Contexto

React Aria xera textos propios que só escoitan as persoas usuarias de lectores de pantalla: o nome das partes dunha data («día», «mes», «ano»), os botóns «Anterior» e «Seguinte» do calendario, os botóns ocultos para pechar un diálogo, etc. A biblioteca inclúe 34 idiomas, pero non o galego. Sen facer nada, cun lector de pantalla en galego esas partes leríanse en inglés.

React Aria ofrece un dicionario global de textos pensado para a renderización no servidor. Le o dicionario unha soa vez, cun único idioma, así que non permite cambiar de idioma en quente.

## Decisión

- Partir dos textos en castelán que publica React Aria (`react-aria-components/i18n/es-ES`) e traducir ao galego os dos compoñentes que se poden usar.
- Rexistrar no dicionario global un obxecto por paquete e substituír o seu contido cando cambia o idioma (`src/i18n/reactAria.ts`). Como React Aria garda a referencia a eses obxectos, os compoñentes len o idioma novo ao volver renderizarse.
- Os paquetes que o prototipo non usa (selector de cor, arrastrar e soltar) quedan en castelán.

## Consecuencias

- Calendario, diálogos e selectores falan galego ou castelán segundo a interface, sen dependencias novas. Hai tests que o comproban.
- Depende dun mecanismo de React Aria pensado para outro uso. Ao actualizar a biblioteca hai que repasar estes tests e o nome dos paquetes.
- Sería útil contribuír estas traducións ao proxecto React Spectrum para que o galego quede dispoñible para calquera.
