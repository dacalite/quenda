# ADR 0007 — React Aria como base do sistema de deseño

- Estado: aceptada
- Data: 16/10/2026

## Contexto

A accesibilidade é o eixo da proposta: os compoñentes complexos (selectores, calendarios, diálogos, lapelas, grupos de opcións) teñen que funcionar con teclado e con VoiceOver, TalkBack e NVDA. Programalos desde cero leva tempo e é doado equivocarse nos detalles: xestión do foco, anuncios, comportamento táctil e diferenzas entre lectores de pantalla.

## Decisión

- Construír o sistema de deseño (`src/ui`) sobre **React Aria Components** (Apache-2.0), de Adobe, que implementa os patróns de ARIA probados en lectores de pantalla e dispositivos táctiles e non impón estilos.
- Dar a aparencia con CSS Modules e variables CSS propias, para que cada concello aplique a súa cor sen dependencias de estilo.
- Traducir ao galego os textos internos da biblioteca ([ADR 0003](0003-react-aria-en-galego.md)).

## Consecuencias

- Selectores, calendario, diálogos e lapelas compórtanse como esperan as tecnoloxías de apoio, e os tests de axe pasan sen axustes.
- A aparencia é totalmente propia e pode cambiar sen tocar o comportamento.
- Algúns compoñentes impoñen detalles que hai que respectar; por exemplo, o nome accesible dun selector inclúe o valor escollido e a etiqueta.
- Os compoñentes simples (enlaces, botóns, táboas, resumo de erros) son HTML semántico propio, sen a biblioteca, onde non achega nada.
