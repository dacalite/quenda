# Informe de probas manuais de accesibilidade

Modelo para rexistrar as probas con tecnoloxías de apoio. Complementa as comprobacións automáticas (axe en todas as pantallas, en escritorio e móbil) descritas en [criterios.md](criterios.md).

## Datos da proba

| Campo                   | Valor                          |
| ----------------------- | ------------------------------ |
| Data                    |                                |
| Persoa que proba        |                                |
| Versión (commit ou URL) |                                |
| Concello e idioma       | Concello de Bouzalonga, galego |

Antes de cada bloque, reinicia a demostración desde «Cambiar de perfil» › «Reiniciar a demostración» para partir sempre dos mesmos datos.

**Resultado:** ✅ correcto · ⚠️ funciona con dificultades · ❌ non funciona. En «Observacións», o que se escoitou ou se viu e, se falla, os pasos para reproducilo.

## Fluxos que se proban en cada contorno

| Código | Fluxo                         | Pasos                                                                                                                                         | Resultado esperado                                                                                                                        |
| ------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| F1     | Orientación                   | Abrir `/bouzalonga`. Percorrer as rexións e os encabezados. Usar «Saltar ao contido».                                                         | Anúncianse cabeceira, navegación, contido principal e pé; un único encabezado de nivel 1; o salto leva ao contido.                        |
| F2     | Visita guiada                 | Abrir a demostración por primeira vez e escoller un perfil (ou «Cambiar de perfil» › «Visita guiada»). Avanzar e retroceder; saír con Escape. | Anúnciase «Paso 1 de 7» e o título do paso; cada paso leva á súa pantalla; ao saír, o foco volve a onde estaba.                           |
| F3     | Buscar                        | Ir a «Instalacións». Filtrar por «Pádel» e por «Acceso sen chanzos». Abrir unha instalación.                                                  | Os filtros teñen nome; anúnciase o número de resultados; a ficha le a accesibilidade física, as normas e as tarifas.                      |
| F4     | Dispoñibilidade               | Na ficha, «Ver dispoñibilidade e reservar». Cambiar de día. Percorrer as franxas de «Tarde». Escoitar as recomendacións.                      | Cada franxa le espazo, día, hora, estado e prezo («…, libre, 4,00 €»); as recomendacións explican a ocupación media.                      |
| F5     | Acceso                        | Escoller unha franxa libre. Na pantalla de acceso, «Entrar con Cl@ve (simulado)».                                                             | O botón e a pantalla simulada anúncianse con claridade; volve á reserva.                                                                  |
| F6     | Reserva con erro              | En «Revisa a túa reserva», confirmar sen aceptar as normas. Seguir a ligazón do resumo de erros.                                              | O resumo recibe o foco e le o erro; a ligazón leva á caixa de aceptación.                                                                 |
| F7     | Confirmación                  | Aceptar as normas e confirmar.                                                                                                                | Anúnciase a confirmación co código; o QR ten texto alternativo e o código tamén está en texto; «Engadir ao calendario» descarga o `.ics`. |
| F8     | As miñas reservas             | Ir a «As miñas reservas». Cambiar entre «Próximas» e «Historial».                                                                             | As lapelas anúncianse como tales e cos seus contidos.                                                                                     |
| F9     | Cambiar e cancelar            | Abrir a reserva nova. «Cambiar a hora» e escoller outra. Despois, «Cancelar a reserva» e confirmar no diálogo.                                | O diálogo anúnciase, atrapa o foco, pecha con Escape e devolve o foco; anúnciase a cancelación.                                           |
| F10    | Avisos                        | Ir a «Avisos». Abrir o aviso do concello sobre o valado e «Escoller outra hora».                                                              | Os avisos sen ler distínguense sen depender da cor; a ligazón leva á dispoñibilidade.                                                     |
| F11    | Perfil e preferencias         | Ir a «Perfil». Cambiar o idioma a castelán e volver ao galego. Abrir «Accesibilidade» e activar texto grande e alto contraste.                | O lector cambia de idioma coa páxina; as preferencias aplícanse ao momento e mantéñense ao recargar.                                      |
| F12    | Persoal: reserva por teléfono | En «Cambiar de perfil», escoller «Persoal do concello». Ir a «Nova reserva», buscar «Manuel», escoller franxa e confirmar por SMS.            | Os resultados da busca anúncianse; anúnciase a reserva creada.                                                                            |
| F13    | Persoal: bloqueo              | Ir a «Bloqueos». Crear un bloqueo sobre unha pista con reservas. Revisar as afectadas e gardar.                                               | Antes de gardar, lese cantas reservas se cancelarán; anúnciase o resultado.                                                               |
| F14    | Persoal: indicadores          | Ir a «Indicadores». Percorrer a táboa de ocupación por día e hora.                                                                            | As cabeceiras de fila e de columna lense en cada cela; o resumo en texto está antes da táboa.                                             |
| F15    | Deputación: alta              | «Ver como: Deputación». «Dar de alta un concello novo». Avanzar sen nome; corrixir; completar os tres pasos.                                  | Anúnciase «Paso 1 de 3»; o resumo de erros recibe o foco; ao rematar, anúnciase a alta e o concello aparece na lista.                     |

## Contornos

Repite os fluxos en cada contorno e anota o resultado.

### 1. VoiceOver en iOS (Safari)

Versión de iOS: ____ · Dispositivo: ____

Pasos previos: activar VoiceOver (Axustes › Accesibilidade › VoiceOver) e o rotor con «Encabezados», «Ligazóns» e «Controis de formulario». Abrir a demostración en Safari e, se se quere, instalala na pantalla de inicio.

Comprobacións específicas: navegación co rotor por encabezados; xestos de activación nos botóns de franxa; lectura das lapelas; selector de data.

| Fluxo | Resultado | Observacións |
| ----- | --------- | ------------ |
| F1    |           |              |
| F2    |           |              |
| F3    |           |              |
| F4    |           |              |
| F5    |           |              |
| F6    |           |              |
| F7    |           |              |
| F8    |           |              |
| F9    |           |              |
| F10   |           |              |
| F11   |           |              |
| F12   |           |              |
| F13   |           |              |
| F14   |           |              |
| F15   |           |              |

### 2. TalkBack en Android (Chrome)

Versión de Android: ____ · Dispositivo: ____

Pasos previos: activar TalkBack (Axustes › Accesibilidade › TalkBack) e configurar o menú de lectura con «Encabezados» e «Controis».

Comprobacións específicas: navegación por encabezados co menú de lectura; selectores despregables; diálogos; anuncios das rexións `aria-live`.

| Fluxo | Resultado | Observacións |
| ----- | --------- | ------------ |
| F1    |           |              |
| F2    |           |              |
| F3    |           |              |
| F4    |           |              |
| F5    |           |              |
| F6    |           |              |
| F7    |           |              |
| F8    |           |              |
| F9    |           |              |
| F10   |           |              |
| F11   |           |              |
| F12   |           |              |
| F13   |           |              |
| F14   |           |              |
| F15   |           |              |

### 3. NVDA en Windows (Firefox e Chrome)

Versión de NVDA: ____ · Navegador e versión: ____

Pasos previos: voz en galego se está dispoñible (se non, castelán). Probar en modo navegación (H, D, F, T) e en modo foco nos formularios.

Comprobacións específicas: cambio automático a modo foco nos campos; lectura de táboas con Ctrl+Alt+frechas; anuncios ao cambiar de pantalla (comprobar se o título se le unha ou dúas veces).

| Fluxo | Resultado | Observacións |
| ----- | --------- | ------------ |
| F1    |           |              |
| F2    |           |              |
| F3    |           |              |
| F4    |           |              |
| F5    |           |              |
| F6    |           |              |
| F7    |           |              |
| F8    |           |              |
| F9    |           |              |
| F10   |           |              |
| F11   |           |              |
| F12   |           |              |
| F13   |           |              |
| F14   |           |              |
| F15   |           |              |

### 4. Só teclado

Navegador: ____

Pasos previos: non usar o rato nin o panel táctil.

Comprobacións específicas: o foco vese sempre e con contraste; a orde de tabulación segue a lectura; non hai trampas de foco fóra dos diálogos modais; Escape pecha diálogos e a visita guiada; frechas nas lapelas, nos grupos de opcións e na visita guiada.

| Fluxo | Resultado | Observacións |
| ----- | --------- | ------------ |
| F1    |           |              |
| F2    |           |              |
| F3    |           |              |
| F4    |           |              |
| F5    |           |              |
| F6    |           |              |
| F7    |           |              |
| F8    |           |              |
| F9    |           |              |
| F10   |           |              |
| F11   |           |              |
| F12   |           |              |
| F13   |           |              |
| F14   |           |              |
| F15   |           |              |

### 5. Zoom ao 200 %

Navegador e resolución: ____

Pasos previos: zoom do navegador ao 200 % nunha xanela de 1280 px de ancho.

Comprobacións específicas: sen desprazamento horizontal (agás dentro das táboas); nada se solapa nin se corta; a barra de lapelas e a visita guiada non tapan o contido.

| Fluxo | Resultado | Observacións |
| ----- | --------- | ------------ |
| F1    |           |              |
| F3    |           |              |
| F4    |           |              |
| F6    |           |              |
| F7    |           |              |
| F9    |           |              |
| F11   |           |              |
| F14   |           |              |
| F15   |           |              |

### 6. Ancho de 320 px

Navegador: ____

Pasos previos: modo de deseño adaptable do navegador a 320 × 640 px, ou un móbil pequeno.

Comprobacións específicas: o menú pásase a un botón despregable; os obxectivos táctiles miden polo menos 44 × 44 px; sen desprazamento horizontal.

| Fluxo | Resultado | Observacións |
| ----- | --------- | ------------ |
| F1    |           |              |
| F2    |           |              |
| F3    |           |              |
| F4    |           |              |
| F7    |           |              |
| F8    |           |              |
| F12   |           |              |
| F15   |           |              |

### 7. Alto contraste

Contorno: ____ (p. ex. «Contraste alto» de Windows ou a preferencia «Alto contraste» da propia aplicación)

Comprobacións específicas: bordos e foco visibles; os estados (libre, ocupada, bloqueada) distínguense sen cor; as iconas seguen viéndose.

| Fluxo | Resultado | Observacións |
| ----- | --------- | ------------ |
| F1    |           |              |
| F4    |           |              |
| F7    |           |              |
| F9    |           |              |
| F11   |           |              |
| F14   |           |              |

## Problemas atopados

| Código | Contorno | Fluxo | Descrición | Criterio WCAG | Gravidade | Estado |
| ------ | -------- | ----- | ---------- | ------------- | --------- | ------ |
|        |          |       |            |               |           |        |

## Conclusión

Resumo das probas, problemas pendentes e prazo previsto para corrixilos.
