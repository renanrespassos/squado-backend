# database/

Migrations versionadas via [node-pg-migrate](https://github.com/salsita/node-pg-migrate).

## Estrutura

```
database/
  migrations/
    1700000000000_baseline.sql   # snapshot do schema em 2026-04-24
    <futuras>.sql
```

## Comandos (rodados de `backend/`)

```bash
cd backend/
npm run migrate:status   # mostra o que aplicaria (--dry-run)
npm run migrate:up       # aplica todas as pending
npm run migrate:down     # reverte a ultima aplicada
npm run migrate:create -- nome-da-migration   # cria arquivo novo
```

Todos exigem `DATABASE_URL` no env.

## Setup inicial em PRODUCAO (banco com dados)

O baseline ja foi aplicado manualmente em 2026-04-24. Para registrar isso
na tabela de controle do node-pg-migrate **sem reaplicar** o schema:

```bash
DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url) \
  psql "$DATABASE_URL" <<SQL
CREATE TABLE IF NOT EXISTS pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMP NOT NULL DEFAULT NOW()
);
INSERT INTO pgmigrations (name) VALUES ('1700000000000_baseline')
  ON CONFLICT DO NOTHING;
SQL
```

Isso roda **uma vez** e nunca mais.

## Setup inicial em DEV (banco vazio)

```bash
npm run migrate:up
```

## Criando novas migrations

```bash
npm run migrate:create -- adicionar-coluna-x
# edita o arquivo gerado em database/migrations/<timestamp>_adicionar-coluna-x.sql
# formato:
#   -- Up Migration
#   ALTER TABLE ... ADD COLUMN ...;
#
#   -- Down Migration
#   ALTER TABLE ... DROP COLUMN ...;
```

Depois aplica em prod via Cloud Shell:
```bash
DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url) \
  npm run migrate:up
```

## Lock concorrente

O node-pg-migrate usa `pg_advisory_lock` automaticamente, entao
multiplas instancias rodando `migrate:up` ao mesmo tempo nao corrompem
nada -- a segunda espera a primeira terminar.
