# Criterios e decisións de accesibilidade

O obxectivo é o nivel **AA das WCAG 2.1**, a referencia da norma EN 301 549 e do Real decreto 1112/2018, e cumprir criterios AAA onde non custa moito. A accesibilidade non é unha capa final: cada compoñente e cada pantalla nacen accesibles e cos seus tests.

## Como se comproba

| Comprobación                | Ferramenta                                                        | Onde                                                                       |
| --------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Erros comúns no código      | `eslint-plugin-jsx-a11y` en modo estrito                          | `npm run lint`, en cada commit e na integración continua                   |
| Compoñentes                 | axe-core en jsdom                                                 | Tests unitarios de `src/ui`                                                |
| Pantallas e estados clave   | Playwright con axe (WCAG 2.0, 2.1 e 2.2 A e AA, e boas prácticas) | `npm run e2e`, en escritorio e en móbil; falla con **calquera** infracción |
| Fluxos só co teclado        | Playwright                                                        | Reserva e cancelación, alta dun concello, visitas guiadas                  |
| Reflow                      | Playwright a 320 px de ancho                                      | Sen desprazamento horizontal                                               |
| Contraste das cores         | Tests sobre os tokens e as cores dos concellos                    | `src/ui/tokens.test.ts` e `src/ui/contrast.test.ts`                        |
| Lectores de pantalla e zoom | Probas manuais                                                    | [informe-probas.md](informe-probas.md)                                     |

As ferramentas automáticas detectan unha parte dos problemas. As probas manuais con VoiceOver, TalkBack e NVDA completan a avaliación.

## Criterios aplicados

### Perceptible

- **Alternativas textuais (1.1.1).** Fotos con texto alternativo descritivo en galego e castelán; iconas decorativas ocultas (`aria-hidden`). O código QR vai sempre acompañado do mesmo código en texto.
- **Información e relacións (1.3.1).** HTML semántico, rexións (`header`, `nav`, `main`, `footer`), un único `h1` por vista e xerarquía de encabezados correcta. Os formularios usan etiquetas visibles, `fieldset` e `legend`.
- **Táboas en lugar de gráficas.** Cada indicador é unha táboa cos valores escritos, cun resumo en texto («A maior ocupación tena o Concello de Bouzalonga, 28 %») e, cando axuda, barras ou sombreado de apoio ([ADR 0011](../adr/0011-graficas-como-taboas.md)).
- **Uso da cor (1.4.1).** O estado dunha franxa, dunha reserva ou dun aviso indícase sempre con texto e icona, ademais da cor.
- **Contraste (1.4.3 e 1.4.11).** 4,5:1 para o texto e 3:1 para os compoñentes e o foco. A cor de cada concello compróbase automaticamente: se non chega a 4,5:1 sobre branco, a configuración avisa, propón unha variante accesible e a web usa esa variante mentres tanto.
- **Redimensionar e reflow (1.4.4 e 1.4.10).** Usable a 320 px de ancho e con zoom ao 200 % sen desprazamento horizontal. As táboas anchas desprázanse dentro do seu propio contedor, que se pode enfocar co teclado.
- **Tipografía.** Atkinson Hyperlegible Next, deseñada para baixa visión, autoaloxada ([ADR 0001](../adr/0001-tipografia-autoaloxada.md)).

### Operable

- **Teclado (2.1.1 e 2.1.2).** Todo funciona co teclado. Os diálogos modais pechan con Escape e devolven o foco a quen os abriu; as visitas guiadas son diálogos non modais que tampouco atrapan o foco.
- **Saltar bloques (2.4.1).** Enlace «Saltar ao contido» como primeira parada do tabulador.
- **Títulos (2.4.2).** Ao cambiar de pantalla actualízase o título do documento: «Reservar: Pista de pádel · Concello de Bouzalonga».
- **Orde e foco visible (2.4.3 e 2.4.7).** O foco móvese ao `h1` da nova vista e anúnciase o cambio; o indicador de foco é propio, groso e con contraste.
- **Tamaño dos obxectivos.** Polo menos 44 × 44 px (criterio AAA 2.5.5).
- **Sen tempo límite (2.2.1).** Ningunha acción caduca; os avisos emerxentes non desaparecen sós.
- **Movemento.** Respéctase `prefers-reduced-motion` e a preferencia propia de «movemento reducido»; nada parpadea.

### Comprensible

- **Idioma (3.1.1 e 3.1.2).** O atributo `lang` cambia co idioma. Os nomes dos idiomas no selector levan o seu propio `lang`.
- **Textos internos en galego.** React Aria non trae galego; os seus textos para lectores de pantalla tradúcense ([ADR 0003](../adr/0003-react-aria-en-galego.md)). Chrome tampouco ten datas e números en galego, e complétanse ([ADR 0004](../adr/0004-intl-en-galego.md)).
- **Etiquetas e instrucións (3.3.2).** Etiquetas sempre visibles, axudas asociadas con `aria-describedby` e `autocomplete` nos datos persoais.
- **Erros (3.3.1 e 3.3.3).** Validación ao enviar, non mentres se escribe. Un resumo de erros ao principio recibe o foco e enlaza con cada campo; cada campo mostra tamén o seu erro. Os erros que devolve o servidor convértense nos mesmos erros de campo.
- **Normas en linguaxe clara.** Se unha regra impide reservar, explícase por que («Só podes reservar con ata 7 días de antelación») e propóñense alternativas.

### Robusto

- **Nome, función e valor (4.1.2).** Compoñentes sobre React Aria, que implementa os patróns ARIA probados en lectores de pantalla ([ADR 0007](../adr/0007-react-aria.md)).
- **Mensaxes de estado (4.1.3).** Confirmacións, gardados e cambios de pantalla anúncianse en rexións `aria-live`.

## Decisións de deseño accesible

- **A lista de franxas é a vista principal** da dispoñibilidade, agrupada en mañá, tarde e noite. Cada franxa anuncia todo o seu estado: «Pista 1, martes 20 de outubro, 18:00 a 19:00, libre, 4,00 €». A vista de semana en táboa é opcional ([ADR 0010](../adr/0010-lista-de-franxas.md)).
- **Preferencias propias** de tamaño de texto (normal, grande e moi grande), alto contraste e movemento reducido, que se suman ás do sistema. O perfil de Manuel, a persoa de demostración que usa lector de pantalla, activa o texto grande.
- **O resumo de erros recibe o foco**, ao estilo de GOV.UK, en vez do primeiro campo con erro: a persoa escoita primeiro cantos erros hai e cales son.
- **Asistentes por pasos** (reserva de tempada e alta dun concello) que indican «Paso 2 de 3» e levan o foco ao título de cada paso.
- **Visitas guiadas propias**: diálogos non modais con `role="dialog"` e `aria-labelledby`, que reciben o foco, indican o progreso, avanzan e retroceden coas frechas, pechan con Escape e devolven o foco.
- **Ningún mapa incrustado**: a localización ábrese na aplicación de mapas da persoa.
- **Nunca superposicións nin _widgets_ de accesibilidade**, que a comunidade de persoas con discapacidade rexeita.

## Limitacións coñecidas

- Pendentes as probas manuais con lectores de pantalla en dispositivos reais ([informe-probas.md](informe-probas.md)).
- Ao cambiar de pantalla, VoiceOver pode ler o título dúas veces (anuncio e foco no encabezado). Revisarase nas probas manuais.
- A lectura do QR coa cámara só funciona en navegadores con `BarcodeDetector`; sempre se pode escribir o código.
