# Interoperabilidade e estándares abertos

Quenda usa estándares abertos en cada punto onde se comunica con outros sistemas ou con outras aplicacións das persoas usuarias. Non hai formatos propios nin dependencias dun provedor.

## Estándares usados

| Ámbito                      | Estándar                                                | Onde se ve                                                                          |
| --------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| API                         | OpenAPI 3.1, JSON (RFC 8259)                            | [`docs/api/openapi.yaml`](api/openapi.yaml), validada con `npm run api:lint`        |
| Erros da API                | Problem Details (RFC 9457)                              | Respostas `application/problem+json` con campos e normas incumpridas                |
| Datas e horas               | ISO 8601 e zona horaria IANA (`Europe/Madrid`)          | Todas as datas da API; calendarios                                                  |
| Calendarios persoais        | iCalendar (RFC 5545)                                    | Botón «Engadir ao calendario» en cada reserva e subscrición en «Calendario persoal» |
| Identificación da cidadanía | SAML 2.0 (Cl@ve) e OpenID Connect                       | Pantalla «Acceder» (simulada no prototipo)                                          |
| Autorización na API         | OAuth 2.0 / OIDC con tokens _bearer_                    | Esquema de seguridade `oidc` da especificación                                      |
| Exportación de datos        | CSV (RFC 4180) en UTF-8                                 | Indicadores e reservas do concello                                                  |
| Portabilidade               | JSON                                                    | «Descargar os meus datos» no perfil (artigo 20 do RGPD)                             |
| Acceso ás instalacións      | Código QR (ISO/IEC 18004) co código da reserva en texto | Detalle da reserva e «Control de acceso»                                            |
| Idiomas                     | Etiquetas BCP 47 (`gl`, `es`)                           | Atributo `lang` da páxina e preferencias                                            |
| Aplicación instalable       | Web App Manifest e Service Worker (W3C)                 | Instalación no móbil e uso sen conexión                                             |
| Accesibilidade              | WCAG 2.1 AA, EN 301 549                                 | Toda a interface ([criterios](accesibilidade/criterios.md))                         |

### Calendarios (RFC 5545)

- Cada reserva descárgase como un ficheiro `.ics` cun evento (`VEVENT`) que inclúe a definición da zona horaria (`VTIMEZONE`), de modo que o calendario a sitúa ben aínda que o móbil estea noutra zona.
- A subscrición é un enderezo `/calendar-feeds/{segredo}.ics` que as aplicacións de calendario consultan periodicamente. Como estas aplicacións non poden iniciar sesión, o acceso depende dun segredo propio de cada persoa, que pode revogar.
- Google Calendar e Outlook ábrense co evento xa cuberto mediante as súas ligazóns públicas de creación de eventos. A plataforma non se conecta a eles: os datos da reserva só saen cando a persoa escolle esa opción.
- O código está en `src/domain/ics.ts` e `src/domain/calendarLinks.ts`, con tests que comproban o formato, os saltos de liña e o escape de caracteres.

### Identificación con Cl@ve e Chave365

- A cidadanía identifícase con Cl@ve, o sistema da Administración Xeral do Estado, ou con Chave365, o da Xunta de Galicia.
- A API non fala directamente con eles. Unha pasarela de identidade (p. ex. Keycloak) federa estes provedores (SAML 2.0 ou OIDC) e emite tokens OIDC para a aplicación. Engadir outro provedor é configuración da pasarela, sen cambios no código.
- O persoal do concello usa contas locais ou o directorio do concello (LDAP ou Active Directory) a través da mesma pasarela.

### Exportación CSV

- As táboas de indicadores e o listado de reservas descárganse en CSV (RFC 4180), en UTF-8 con marca de orde de bytes para que as follas de cálculo lean ben os acentos (`src/domain/csv.ts`).
- A exportación de reservas non leva nomes de persoas.

## Datos abertos

O sistema pode publicar, para cada concello, un conxunto de datos agregado de ocupación das instalacións deportivas:

- **Contido:** ocupación por instalación, día da semana e franxa horaria; número de reservas, cancelacións e non presentadas por mes. Calcúlase coas mesmas funcións que os indicadores do panel (`src/domain/analytics/indicators.ts`).
- **Sen datos persoais:** só cifras agregadas, sen titulares nin códigos de reserva.
- **Formatos:** CSV e JSON, cunha licenza aberta como CC BY 4.0.
- **Metadatos:** descritos segundo DCAT-AP e o perfil español DCAT-AP-ES / NTI-RISP, para que o catálogo de datos abertos do concello, da deputación ou de datos.gob.es os recolla automaticamente.

Exemplo de metadatos (JSON-LD, abreviado):

```json
{
  "@context": "https://www.w3.org/ns/dcat",
  "@type": "Dataset",
  "title": { "@language": "gl", "@value": "Ocupación das instalacións deportivas municipais" },
  "publisher": "Concello de Bouzalonga",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "accrualPeriodicity": "http://purl.org/cld/freq/monthly",
  "distribution": [
    { "@type": "Distribution", "mediaType": "text/csv", "downloadURL": "…/ocupacion.csv" },
    { "@type": "Distribution", "mediaType": "application/json", "downloadURL": "…/ocupacion.json" }
  ]
}
```

## Esquema Nacional de Interoperabilidade

A proposta segue o Esquema Nacional de Interoperabilidade (Real decreto 4/2010) e as súas normas técnicas:

- **Estándares abertos** en todas as interfaces, como recolle a táboa anterior.
- **Reutilización:** o código publícase con licenza EUPL-1.2, a licenza da Unión Europea recomendada para software das administracións, e pode incorporarse ao Centro de Transferencia de Tecnoloxía (CTT) e a outros repositorios públicos.
- **Interoperabilidade organizativa:** a mesma instalación serve a varios concellos dunha deputación sen perder a autonomía de cada un.
- **Interoperabilidade semántica:** a API e os datos abertos usan nomes e formatos documentados (OpenAPI e DCAT-AP).
- **Plurilingüismo:** galego e castelán desde o primeiro día, e preparado para engadir máis idiomas.
- **Seguridade:** aliñada co Esquema Nacional de Seguridade ([seguridade e RXPD](seguridade-rxpd.md)).

## Integracións previstas

| Sistema                               | Como                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Padrón municipal (empadroamento)      | Consulta á API do padrón do concello para marcar «empadroada» e a tarifa |
| Pasarela de pagamentos do concello    | Módulo de pagamentos opcional                                            |
| Correo e SMS                          | Provedores intercambiables detrás dun adaptador                          |
| Sede electrónica e portal do concello | Ligazón á aplicación e, se se quere, inserción das páxinas públicas      |
| Catálogo de datos abertos             | Conxunto de datos con metadatos DCAT-AP                                  |
