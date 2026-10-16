# Seguridade e protección de datos

Este documento recolle as medidas de seguridade e de protección de datos do sistema completo. O prototipo non envía datos a ningún servidor: todo queda no navegador de quen o proba e bórrase ao reiniciar a demostración.

## Esquema Nacional de Seguridade

O sistema trata datos persoais de veciñanza e, se se activa, cobros. Proponse a **categoría MEDIA** do Esquema Nacional de Seguridade (Real decreto 311/2022). Un concello que só o use para reservas gratuítas pode valorar a categoría BÁSICA.

| Ámbito                         | Medidas                                                                                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identificación e autenticación | Cidadanía con Cl@ve ou Chave365; persoal con contas nominativas e segundo factor; tokens OIDC de curta duración (familia `op.acc`)                                      |
| Control de acceso              | Roles cidadanía, conserxería, administración e deputación, comprobados no servidor en cada petición; illamento por concello en base de datos (RLS)                      |
| Segregación de funcións        | A conserxería opera pero non configura; só a administración cambia normas, horarios e permisos e le o rexistro de actividade                                            |
| Rexistro de actividade         | Quen creou, cambiou ou cancelou que e cando, sen posibilidade de editalo (`op.exp.8`)                                                                                   |
| Cifrado en tránsito            | HTTPS con TLS 1.2 ou superior e HSTS en todos os enderezos (`mp.com.2`)                                                                                                 |
| Cifrado en repouso             | Discos e copias cifrados; segredos fóra do código, nun xestor de segredos                                                                                               |
| Copias de seguridade           | Copia diaria da base de datos con retención de 30 días e proba de restauración trimestral (`mp.info.6`)                                                                 |
| Actualizacións                 | Dependencias revisadas na integración continua; só licenzas libres comprobadas (`npm run licenses`); imaxes de contedores reconstruídas con cada versión                |
| Protección da aplicación       | Validación de todas as entradas co esquema OpenAPI; política de seguridade de contido (CSP) estrita, sen scripts de terceiros; límites de peticións por IP e por persoa |
| Continuidade                   | Despregamento en varias réplicas na instancia compartida e procedemento de recuperación documentado                                                                     |

## Protección de datos (RXPD)

### Principios aplicados

- **Base xurídica.** Exercicio de poderes públicos e misión de interese público na xestión de instalacións municipais (artigo 6.1.e do RGPD), e consentimento só para as canles de aviso opcionais.
- **Minimización.** Só os datos necesarios para reservar e para aplicar a tarifa: nome, contacto, empadroamento e colectivo con bonificación. O DNI gárdase **enmascarado** (`***4521**`), que basta para identificar a persoa no mostrador. A exportación de reservas para o persoal non leva nomes.
- **Aloxamento na Unión Europea**, nos servidores da deputación, do concello ou dun provedor con centros de datos na UE.
- **Roles e permisos.** Cada persoa só ve as súas reservas e os seus avisos; o persoal ve as do seu concello; a deputación só ve cifras agregadas dos seus concellos.
- **Transparencia.** Política de privacidade e declaración de accesibilidade editables por cada concello desde a súa configuración, sen tocar código.
- **Dereitos.** Desde o perfil, cada persoa descarga os seus datos en JSON (acceso e portabilidade) e solicita a eliminación. No prototipo as dúas accións están simuladas.
- **Privacidade por defecto.** Nada de analítica de terceiros, fontes externas, mapas incrustados nin chamadas a outros servizos ao usar a aplicación.

### Conservación

Os prazos dependen da normativa de arquivo de cada concello; estes son os valores por defecto que se propoñen, configurables:

| Dato                               | Prazo proposto                                                 |
| ---------------------------------- | -------------------------------------------------------------- |
| Reservas e o seu historial         | 2 anos desde a data da reserva; despois só se gardan agregadas |
| Rexistro de actividade             | 2 anos                                                         |
| Avisos                             | 6 meses                                                        |
| Contas da cidadanía sen actividade | Eliminación tras 3 anos, cun aviso previo                      |
| Datos de pagamento                 | Os que esixa a normativa tributaria; nunca datos de tarxeta    |
| Copias de seguridade               | 30 días                                                        |

### Avaliación de impacto

O tratamento non inclúe categorías especiais de datos de forma sistemática (a bonificación por diversidade funcional só garda que existe a bonificación, non o diagnóstico), nin perfilado nin decisións automatizadas. Aínda así, recoméndase que cada concello faga unha análise de riscos e valore se precisa unha avaliación de impacto (artigo 35 do RGPD), sobre todo na instancia compartida dunha deputación.

## Modelo de rexistro de actividades de tratamento

Para incorporar ao rexistro do concello (artigo 30 do RGPD).

| Campo                             | Contido                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Nome do tratamento                | Xestión de reservas de instalacións deportivas municipais                                                                               |
| Responsable                       | Concello de [nome], [enderezo], [contacto]                                                                                              |
| Delegado de protección de datos   | [Contacto do DPD do concello]                                                                                                           |
| Finalidade                        | Xestionar as reservas, o acceso ás instalacións, os avisos ás persoas usuarias, a aplicación de tarifas e os indicadores de uso         |
| Base xurídica                     | Artigo 6.1.e do RGPD; ordenanza municipal de uso das instalacións e de prezos públicos; consentimento para os avisos opcionais          |
| Categorías de persoas interesadas | Veciñanza e outras persoas usuarias; representantes de clubs e asociacións; persoal municipal                                           |
| Categorías de datos               | Identificativos (nome, DNI enmascarado), contacto (correo e teléfono), empadroamento, colectivo con bonificación, reservas e asistencia |
| Categorías de destinatarios       | Persoal do concello; deputación, como encargada do tratamento, na instancia compartida; non se ceden datos a terceiros                  |
| Transferencias internacionais     | Ningunha                                                                                                                                |
| Prazos de supresión               | Os da táboa de conservación                                                                                                             |
| Medidas de seguridade             | As do Esquema Nacional de Seguridade, categoría [básica ou media], descritas neste documento                                            |

## Encargo do tratamento

- Na **instancia compartida**, cada concello segue sendo o responsable dos datos da súa veciñanza e a deputación actúa como **encargada do tratamento**. A relación fórmase cun convenio ou acordo de encargo segundo o artigo 28 do RGPD, que debe recoller o obxecto e a duración, as instrucións do concello, a confidencialidade, as medidas de seguridade, as subcontratacións autorizadas (p. ex. o provedor de aloxamento ou de SMS), a asistencia no exercicio de dereitos, a devolución ou a supresión dos datos ao rematar e as auditorías.
- Na **instancia propia**, se o concello contrata o aloxamento ou o mantemento, o provedor é o encargado e precisa o mesmo contrato.
- Os provedores de correo e de SMS son subencargados e deben ofrecer garantías equivalentes e tratar os datos na UE.
