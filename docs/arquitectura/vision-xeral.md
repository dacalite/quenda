# Visión xeral da arquitectura

Quenda é unha plataforma de reserva de instalacións deportivas municipais para concellos e deputacións. Este documento describe o sistema completo que se propón e como se relaciona co prototipo publicado.

## Principios

- **Software libre** baixo EUPL-1.2, con dependencias de licenzas aprobadas pola OSI ([ADR 0006](../adr/0006-licenza-eupl.md)).
- **Un único código para moitos concellos.** Cada concello é un _tenant_ con datos illados, imaxe, idiomas e normas propias ([ADR 0008](../adr/0008-multitenant-con-rls.md)).
- **Accesibilidade desde o deseño**: WCAG 2.1 AA, a referencia da EN 301 549 e do Real decreto 1112/2018 ([criterios](../accesibilidade/criterios.md)).
- **Estándares abertos** en cada fronteira: OpenAPI, iCalendar, OIDC e SAML, CSV e JSON ([interoperabilidade](../interoperabilidade.md)).
- **Sen dependencia de provedor**: contedores estándar que funcionan nun centro de datos propio ou en calquera nube con aloxamento na UE.

## Compoñentes

```mermaid
flowchart LR
  subgraph Persoas
    C[Cidadanía]
    P[Persoal do concello]
    D[Deputación]
  end

  subgraph Cliente
    PWA["Aplicación web progresiva<br/>React + React Aria"]
  end

  subgraph Servidor["API REST modular · Node.js + TypeScript"]
    direction TB
    API[Rutas OpenAPI 3.1]
    DOM["Dominio compartido<br/>regras de reserva, prezos,<br/>recomendacións e indicadores"]
    MOD["Módulos: concellos, instalacións,<br/>horarios, reservas, tempada,<br/>persoas, avisos, deputación"]
    JOBS[Traballos programados<br/>recordatorios e non presentadas]
    API --> MOD --> DOM
    JOBS --> MOD
  end

  DB[("PostgreSQL<br/>seguridade por fila por concello")]
  IDP["Pasarela de identidade OIDC<br/>p. ex. Keycloak"]
  CLAVE[Cl@ve · SAML 2.0]
  CHAVE[Chave365]
  MAIL[Correo SMTP]
  SMS[Provedor de SMS]
  PAY["Pasarela de pagamentos<br/>módulo opcional"]
  FILES[("Almacenamento de obxectos<br/>escudos e fotos")]

  C & P & D --> PWA
  PWA -- "HTTPS · JSON" --> API
  PWA -- "OIDC" --> IDP
  IDP --> CLAVE & CHAVE
  API -- "valida o token" --> IDP
  MOD --> DB
  MOD --> FILES
  MOD --> MAIL & SMS
  MOD -.-> PAY
```

| Peza            | Proposta                                                     | Por que                                                                                                                 |
| --------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Cliente         | Aplicación web progresiva en React con React Aria            | Instalable no móbil, funciona sen conexión e é accesible con lector de pantalla ([ADR 0007](../adr/0007-react-aria.md)) |
| API             | Node.js e TypeScript con Fastify                             | Comparte co cliente o mesmo código de dominio (`src/domain`) e valida as peticións co esquema OpenAPI                   |
| Datos           | PostgreSQL 16 ou superior con seguridade por fila (RLS)      | Illamento entre concellos garantido pola base de datos, non só polo código                                              |
| Identidade      | Pasarela OIDC (Keycloak ou equivalente)                      | Federa Cl@ve (SAML 2.0) e Chave365 para a cidadanía, e contas locais ou o directorio do concello para o persoal         |
| Avisos          | Cola de traballos en PostgreSQL e provedores intercambiables | Correo por SMTP e SMS a través dun adaptador; cambiar de provedor non toca o resto                                      |
| Pagamentos      | Módulo opcional enchufable                                   | Cada concello usa a súa pasarela; sen ela, a reserva queda «pendente de pagamento»                                      |
| Ficheiros       | Almacenamento compatible con S3 (p. ex. MinIO)               | Escudos e fotos das instalacións, fóra da base de datos                                                                 |
| Observabilidade | Rexistros JSON estruturados e métricas OpenTelemetry         | Integrables nas ferramentas que xa teña o concello ou a deputación                                                      |

A API organízase por módulos que corresponden aos portos do prototipo (`src/data/ports`) e á especificación [`openapi.yaml`](../api/openapi.yaml). Cada módulo comproba os permisos da persoa que chama:

- a cidadanía só accede ás súas reservas, ao seu perfil e aos seus avisos;
- o persoal (conserxería e administración) opera no seu concello;
- só a administración cambia a configuración e le o rexistro de actividade;
- a deputación ve os seus concellos e dá de alta outros novos.

## Do prototipo ao sistema completo

O prototipo é a capa de presentación do sistema real. A diferenza está só no adaptador de datos ([ADR 0009](../adr/0009-prototipo-con-adaptador-local.md)).

| Sistema completo       | Prototipo                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| API REST               | Adaptador local (`src/data/adapters/local`) co mesmo contrato, latencia simulada e erros tipados       |
| PostgreSQL con RLS     | `localStorage`, con todas as consultas acoutadas por concello e un test que demostra que non hai fugas |
| Permisos no servidor   | O adaptador local aplica as mesmas regras de rol en cada chamada                                       |
| Cl@ve e Chave365       | Pantalla de acceso simulada que devolve a persoa de demostración                                       |
| Correo e SMS           | Avisos dentro da aplicación, coa canle elixida anotada                                                 |
| Pasarela de pagamentos | Importe e estado «pendente» ou «pagado (simulado)»                                                     |
| Rexistro de actividade | Mesmo rexistro, gardado no navegador                                                                   |

O adaptador HTTP (`src/data/adapters/http`) implementa os mesmos portos contra a API descrita na especificación OpenAPI. Cambiar un adaptador polo outro non obriga a tocar as pantallas.

## Estrutura do código

```
src/
  domain/     regras de reserva, prezos, dispoñibilidade, recomendacións e indicadores (funcións puras)
  data/       portos (contrato da API), adaptadores local e HTTP, e semente de demostración
  app/        estrutura da aplicación, rutas, foco e anuncios
  features/   pantallas de cidadanía, concello, deputación e barra de demostración
  ui/         sistema de deseño accesible sobre React Aria
  i18n/       textos en galego e castelán
```

O dominio non depende de React nin do almacenamento. Por iso o mesmo código de regras pode executarse no servidor, que é quen ten a última palabra sobre cada reserva.

## Modelos de despregamento

O mesmo software sérvelle a unha deputación que agrupa concellos e a un concello que prefire a súa propia instalación. Un concello pode pasar dun modelo ao outro exportando os seus datos.

```mermaid
flowchart TB
  subgraph Compartida["Instancia compartida da deputación"]
    direction TB
    LB1[Proxy inverso HTTPS]
    WEB1[Aplicación web]
    API1[API · varias réplicas]
    DB1[("PostgreSQL<br/>un esquema, RLS por concello")]
    IDP1[Pasarela de identidade]
    LB1 --> WEB1 & API1
    API1 --> DB1
    API1 --> IDP1
  end
  CA[Concello A] & CB[Concello B] & CC[Concello C] --> LB1

  subgraph Propia["Instancia propia dun concello"]
    direction TB
    LB2[Proxy inverso HTTPS]
    WEB2[Aplicación web]
    API2[API]
    DB2[(PostgreSQL)]
    IDP2[Pasarela de identidade ou a do concello]
    LB2 --> WEB2 & API2
    API2 --> DB2
    API2 --> IDP2
  end
  CD[Concello D] --> LB2

  CLAVE2[Cl@ve e Chave365]
  IDP1 --> CLAVE2
  IDP2 --> CLAVE2
```

- **Instancia compartida.** A deputación mantén unha soa instalación (Kubernetes con Helm ou varias máquinas con Docker Compose). Cada concello ten o seu enderezo, a súa imaxe e as súas normas, e dáse de alta desde a vista da deputación sen instalar nada. É a opción indicada para concellos pequenos sen persoal técnico.
- **Instancia propia.** O concello desprégaa nos seus servidores ou nos do seu provedor, coa mesma funcionalidade. Encaixa cando xa ten sistemas propios ou quere integralos.

Os requisitos e os pasos están en [despregamento.md](../despregamento.md).
