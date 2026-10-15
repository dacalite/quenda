# ADR 0004 — Formato de datas, números e plurais en galego en Chrome

- Estado: aceptada
- Data: 15/10/2026

## Contexto

O prototipo formatea datas, prezos e listas coa API `Intl` do navegador, e React Aria e i18next tamén a usan: para os nomes das partes dunha data e para escoller os plurais. Firefox e Safari inclúen os datos do galego, pero Chrome non (comprobado en Chrome 143 e en Chromium 156). Con `gl`, Chrome recorre ao castelán ou mesmo ao inglés: «M10 20, Tue», «Year», «€ 4.00», e plurais como «1 avisos». Chrome é o navegador máis usado en Android, así que é o que terán moitas persoas usuarias de TalkBack.

## Decisión

- Ao arrancar, comprobar se o navegador formatea o galego. Se non o fai, substituír en `Intl` os constructores `DateTimeFormat`, `NumberFormat`, `PluralRules`, `ListFormat` e `DisplayNames`, só para os locales `gl` (`src/i18n/galicianIntl.ts`).
- Formatear co castelán, que ten os mesmos patróns, e cambiar as palabras: meses e días da semana nas tres anchuras, «e» e «ou» nas listas, «ás» diante da hora e os nomes dos campos de data («ano», «mes», «día»).
- Non engadir ningún polyfill completo nin dependencia nova.

## Consecuencias

- O galego vese e escóitase correctamente en Chrome: textos propios, compoñentes de React Aria e plurais.
- Nos navegadores que xa traen galego non se cambia nada.
- Os tests unitarios proban as clases substitutas directamente, e os e2e comproban en Chromium real que o nome accesible dunha franxa está en galego.
- Se algún día Chrome inclúe o galego, a comprobación inicial desactiva o complemento sen tocar o código.
