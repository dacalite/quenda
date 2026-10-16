# Modelo de datos

As entidades son as de `src/domain/types.ts`. No sistema completo gárdanse en PostgreSQL; no prototipo, no `localStorage` do navegador, coa mesma forma (`src/data/adapters/local/database.ts`).

## Diagrama entidade-relación

```mermaid
erDiagram
  DEPUTACION ||--o{ TENANT : agrupa
  TENANT ||--o{ FACILITY : ten
  TENANT ||--o{ HOLIDAY : ten
  TENANT ||--o{ USER : ten
  TENANT ||--o{ ENTITY : ten
  TENANT ||--o{ AUDIT_ENTRY : rexistra
  FACILITY ||--|{ SUBSPACE : "divídese en"
  FACILITY ||--|| SCHEDULE : abre
  SCHEDULE ||--o{ SCHEDULE_EXCEPTION : "ten excepcións"
  FACILITY ||--o{ BLOCK : "pode bloquearse"
  FACILITY ||--o{ RESERVATION : recibe
  SUBSPACE ||--o{ RESERVATION : ocupa
  USER |o--o{ RESERVATION : "é titular"
  ENTITY |o--o{ RESERVATION : "é titular"
  ENTITY ||--o{ RECURRING_BOOKING : ten
  FACILITY ||--o{ RECURRING_BOOKING : acolle
  RECURRING_BOOKING |o--o{ RESERVATION : xera
  RESERVATION ||--o{ RESERVATION_EVENT : historial
  USER ||--o{ NOTIFICATION : recibe
  RESERVATION |o--o{ NOTIFICATION : motiva

  DEPUTACION {
    uuid id PK
    text name
  }
  TENANT {
    uuid id PK
    uuid deputacion_id FK "opcional"
    text slug UK
    text name
    text primary_color
    text emblem
    text_array languages
    text time_zone
    jsonb legal "aviso legal, privacidade e accesibilidade en gl e es"
    jsonb default_rules "normas xerais"
  }
  FACILITY {
    uuid id PK
    uuid tenant_id FK
    text name
    text type
    jsonb description
    text address
    point coordinates
    int capacity
    text_array accessibility
    jsonb usage_rules
    text status "active ou inactive"
    jsonb rules "sobrescribe as normas xerais"
    jsonb pricing
  }
  SUBSPACE {
    text id PK
    uuid facility_id PK, FK
    jsonb name
    int capacity
    text_array contains
  }
  SCHEDULE {
    uuid facility_id PK, FK
    uuid tenant_id FK
    int slot_minutes "30, 60 ou 90"
    jsonb weekly "tramos por día da semana"
  }
  SCHEDULE_EXCEPTION {
    uuid facility_id PK, FK
    date date PK
    jsonb ranges "baleiro se pecha"
    text reason
  }
  HOLIDAY {
    uuid id PK
    uuid tenant_id FK
    date date UK
    jsonb name
  }
  BLOCK {
    uuid id PK
    uuid tenant_id FK
    uuid facility_id FK
    text subspace_id "nulo se bloquea todo"
    daterange dates
    text start_time
    text end_time
    text reason
    text note
    timestamptz created_at
    uuid created_by FK
  }
  RESERVATION {
    uuid id PK
    uuid tenant_id FK
    text code UK "QDA-7K3M"
    uuid facility_id FK
    text subspace_id FK
    date date
    time start_time
    time end_time
    uuid user_id FK "titular persoa"
    uuid entity_id FK "titular entidade"
    text status
    text channel "web, phone ou inPerson"
    int amount_cents
    text payment
    text notes
    uuid recurring_booking_id FK
    timestamptz checked_in_at
    timestamptz created_at
    uuid created_by FK
  }
  RESERVATION_EVENT {
    uuid reservation_id FK
    timestamptz at
    uuid by FK
    text type
    text detail
  }
  RECURRING_BOOKING {
    uuid id PK
    uuid tenant_id FK
    uuid entity_id FK
    uuid facility_id FK
    text subspace_id
    int weekday
    time start_time
    time end_time
    daterange season
    date_array exceptions
    timestamptz created_at
  }
  USER {
    uuid id PK
    uuid tenant_id FK
    text first_name
    text last_name
    text masked_dni "só enmascarado"
    text email
    text phone
    bool resident
    text_array concessions
    text role "citizen, staff ou admin"
    jsonb preferences
  }
  ENTITY {
    uuid id PK
    uuid tenant_id FK
    text name
    text kind "club ou association"
    text registry_number
    text contact_name
    text phone
    text email
  }
  NOTIFICATION {
    uuid id PK
    uuid tenant_id FK
    uuid user_id FK
    uuid reservation_id FK
    text type
    text channel "app, email ou sms"
    timestamptz created_at
    timestamptz read_at
  }
  AUDIT_ENTRY {
    uuid id PK
    uuid tenant_id FK
    timestamptz at
    uuid actor_id
    text action
    text subject
    uuid subject_id
    text label
  }
```

### Notas sobre o modelo

- **Titular dunha reserva.** É unha persoa ou unha entidade, nunca as dúas: unha restrición `CHECK (num_nonnulls(user_id, entity_id) = 1)` garánteo.
- **Espazos que se conteñen.** Un campo enteiro (`full`) contén os dous medios campos. O dominio considera ocupados os espazos relacionados, de modo que non se pode reservar o campo enteiro se un medio xa está collido (`subspacesOverlap` en `src/domain/rules/availability.ts`).
- **Normas con herdanza.** `TENANT.default_rules` son as normas xerais e `FACILITY.rules` só garda as que cambian; `resolveRules` combínaas.
- **Datas e horas locais.** As datas e horas de reservas, horarios e bloqueos son do calendario do concello (`time_zone`); os instantes (`created_at`, `checked_in_at`) gárdanse en UTC.
- **Importes en céntimos** (`int`), para evitar erros de redondeo.
- **Textos en varios idiomas** en `jsonb` co código de idioma como clave (`{"gl": "…", "es": "…"}`).
- **Instalacións que non se borran.** Desactívanse (`status = 'inactive'`) para conservar o historial e os indicadores.
- **Historial e rexistro de actividade.** `RESERVATION_EVENT` garda o que lle pasou a cada reserva; `AUDIT_ENTRY`, quen cambiou que no concello. Ningún dos dous se edita.

## Illamento entre concellos

Todas as táboas dun concello levan `tenant_id`. O illamento ten tres capas:

1. **Na API.** Cada ruta está baixo `/tenants/{tenantId}` e o servidor comproba que a persoa identificada pertence a ese concello.
2. **Na base de datos.** A seguridade por fila de PostgreSQL filtra cada consulta polo concello da petición, aínda que o código se esqueza de facelo:

   ```sql
   ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
   ALTER TABLE reservation FORCE ROW LEVEL SECURITY;

   CREATE POLICY tenant_isolation ON reservation
     USING (tenant_id = current_setting('app.tenant_id')::uuid)
     WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
   ```

   A API abre cada transacción con `SET LOCAL app.tenant_id = '…'` e conecta cun usuario sen o permiso `BYPASSRLS`.

3. **Nas relacións.** As claves foráneas inclúen o concello, p. ex. `FOREIGN KEY (tenant_id, facility_id) REFERENCES facility (tenant_id, id)`, para que unha reserva non poida apuntar á instalación doutro concello.

A deputación só le os concellos con `deputacion_id` igual ao seu, e os indicadores agregados calcúlanse sen datos persoais.

No prototipo, o adaptador local acouta todas as consultas por concello e un test (`tenant isolation`, en `src/data/adapters/local/repositories.test.ts`) comproba que ningunha devolve filas doutro concello nin permite reservar nel.

Por que esta opción e non unha base de datos por concello está en [ADR 0008](../adr/0008-multitenant-con-rls.md).
