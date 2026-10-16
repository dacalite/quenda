# ADR 0011 — Indicadores en táboas, sen biblioteca de gráficas

- Estado: aceptada
- Data: 16/10/2026

## Contexto

Os indicadores do concello e da deputación (ocupación por instalación e por día e hora, cancelacións, non presentadas, canles e tipo de uso) poderían debuxarse con gráficas. O deseño inicial contemplaba Recharts, coa condición de que cada gráfica tivese unha táboa de datos alternativa e un resumo en texto.

Ao construír os indicadores comprobouse que as táboas cos valores escritos, un resumo en texto e un apoio visual dentro da propia táboa (barras de proporción e un mapa de calor sombreado) transmiten a mesma información sen duplicala nin engadir dependencias.

## Decisión

- Presentar cada indicador como **táboa** con cabeceiras de fila e de columna, valores escritos e un **resumo en texto** antes da táboa («En Pista de pádel, a hora con máis demanda é o martes ás 19:00, cun 92 %»).
- Usar o sombreado das celas e barras de proporción só como apoio visual; o dato está sempre escrito.
- Ofrecer cada táboa en CSV.
- Non engadir Recharts nin outra biblioteca de gráficas por agora. A decisión revisarase no redeseño visual do prototipo.

## Consecuencias

- Unha soa representación accesible por indicador, que se le igual cun lector de pantalla que coa vista.
- Ningunha dependencia nova nin peso extra na aplicación.
- A lectura dunha tendencia dun golpe de vista é menos inmediata ca nunha gráfica de liñas. Se o redeseño engade gráficas, as táboas quedarán como alternativa e o resumo en texto seguirá.
