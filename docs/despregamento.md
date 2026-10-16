# Despregamento

Como despregaría un concello ou unha deputación a súa propia instancia do sistema completo, e como se publica o prototipo. Os modelos (instancia compartida ou propia) explícanse en [visión xeral](arquitectura/vision-xeral.md#modelos-de-despregamento).

## O prototipo

O prototipo é un sitio estático: calquera servidor web serve.

```sh
npm ci
npm run build           # xera dist/
BASE_PATH=/reservas/ npm run build   # se se publica nun subcartafol
```

- Hai que servir `index.html` para calquera ruta descoñecida (en GitHub Pages faise copiándoo a `404.html`, como fai `.github/workflows/deploy.yml`).
- Non fai ningunha chamada a servizos externos: tipografía, iconas e datos van dentro.
- A demostración pública desprégase en GitHub Pages en cada cambio da rama principal.

## O sistema completo

Esta parte describe o despregamento previsto do sistema real; o prototipo actual só inclúe a aplicación web.

### Compoñentes

| Compoñente                 | Imaxe ou paquete                                    | Notas                                                  |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| Aplicación web             | Ficheiros estáticos detrás dun servidor web (nginx) | A mesma compilación que o prototipo, co adaptador HTTP |
| API                        | Contedor Node.js 22 LTS                             | Sen estado; escala engadindo réplicas                  |
| Base de datos              | PostgreSQL 16 ou superior                           | Seguridade por fila activada                           |
| Pasarela de identidade     | Keycloak (ou a que xa teña o concello)              | Federada con Cl@ve e Chave365                          |
| Almacenamento de ficheiros | Compatible con S3 (MinIO) ou disco compartido       | Escudos e fotos                                        |
| Proxy inverso              | nginx, Traefik ou o balanceador da nube             | HTTPS con certificados renovados automaticamente       |

Correo (SMTP), SMS e pasarela de pagamentos son servizos externos que se configuran con variables de contorno.

### Instancia propia dun concello (Docker Compose)

Para un concello pequeno ou mediano basta unha máquina virtual con Docker Compose:

1. Preparar unha máquina Linux con Docker, nun centro de datos propio ou dun provedor con aloxamento na UE.
2. Copiar o ficheiro `compose.yaml` da versión e un ficheiro `.env` cos segredos (contrasinal da base de datos, credenciais de correo e SMS, cliente OIDC).
3. Rexistrar a aplicación como cliente na pasarela de identidade e solicitar a integración con Cl@ve e Chave365.
4. Arrancar (`docker compose up -d`). A API aplica as migracións da base de datos ao iniciar.
5. Crear a primeira conta de administración e entrar en «Configuración» para completar o nome, o escudo, a cor, os idiomas, os textos legais e as normas.
6. Dar de alta as instalacións, os horarios e as tarifas desde a xestión, sen tocar código.

### Instancia compartida dunha deputación (Kubernetes)

Para unha deputación con moitos concellos recoméndase Kubernetes cun _chart_ de Helm:

- API con varias réplicas e escalado automático; base de datos xestionada ou en alta dispoñibilidade (réplica en espera).
- Un único dominio con rutas por concello (`/bouzalonga`, `/ribasmeiras`) ou subdominios.
- Os concellos novos dánse de alta desde a vista da deputación, en quente e sen despregar nada.
- A deputación administra copias, actualizacións e monitorización para todos.

### Estimación de recursos

Valores orientativos de partida, que convén axustar coas métricas reais de uso.

| Escenario                                | API                        | Base de datos             | Almacenamento                       |
| ---------------------------------------- | -------------------------- | ------------------------- | ----------------------------------- |
| Concello pequeno (ata 10 000 habitantes) | 1 vCPU, 1 GB               | 1 vCPU, 2 GB              | 10 GB                               |
| Concello mediano (ata 50 000 habitantes) | 2 réplicas de 1 vCPU, 1 GB | 2 vCPU, 4 GB              | 20 GB                               |
| Deputación con 50 concellos              | 3 réplicas de 2 vCPU, 2 GB | 4 vCPU, 8 GB, con réplica | 100 GB e copias noutra localización |

A carga é baixa: unha reserva son poucas consultas e a maior parte do tráfico é a aplicación web, que se serve como ficheiros estáticos con caché. A pasarela de identidade engade 1 vCPU e 2 GB.

### Operación

- **Copias de seguridade:** copia diaria da base de datos e dos ficheiros, cifrada, con retención de 30 días e proba de restauración trimestral.
- **Actualizacións:** versións con numeración semántica e notas de cambios; as migracións da base de datos son automáticas e reversibles.
- **Monitorización:** comprobación de saúde da API, rexistros JSON e métricas OpenTelemetry, integrables nas ferramentas do concello ou da deputación.
- **Seguridade:** medidas do Esquema Nacional de Seguridade descritas en [seguridade e RXPD](seguridade-rxpd.md).
- **Datos:** cada concello pode exportar os seus datos para cambiar de modelo de despregamento.
