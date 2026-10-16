# ADR 0010 — A lista de franxas como vista principal da dispoñibilidade

- Estado: aceptada
- Data: 16/10/2026

## Contexto

As aplicacións de reservas adoitan amosar a dispoñibilidade nunha grella de días e horas. Cun lector de pantalla, unha grella grande obriga a percorrer cela a cela, sen saber a que día e a que hora corresponde cada unha se non se len tamén as cabeceiras, e en móbil queda pequena.

## Decisión

- A vista por defecto é unha **lista de franxas dun día**, agrupada en mañá, tarde e noite con encabezados, e navegación de data con botóns «Día anterior» e «Día seguinte» e un selector de data.
- Cada franxa é un elemento con nome completo: espazo, día, hora, estado e prezo («Pista 1, martes 20 de outubro, 18:00 a 19:00, libre, 4,00 €»). O estado vai sempre con texto e icona, non só con cor.
- Enriba da lista, as horas recomendadas por estaren tranquilas, explicadas coa ocupación media.
- A vista de semana en táboa é opcional, para quen prefire comparar días.

## Consecuencias

- Cun lector de pantalla basta saltar por encabezados ata o tramo do día e escoitar as franxas unha a unha.
- En móbil a lista lese sen zoom nin desprazamento horizontal.
- Ver a semana enteira de golpe require cambiar de vista.
