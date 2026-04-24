-- Up Migration

-- Schema baseline capturado de producao em 2026-04-24
-- Esta migration EXISTE apenas para registrar o estado inicial.
-- Em producao, marque como ja-aplicada: INSERT INTO pgmigrations(name) VALUES (?1700000000000_baseline?);
-- Em dev (banco vazio), rode normalmente: npm run migrate:up

--
-- PostgreSQL database dump
--

\restrict aBTfYBtwrd7fscmzyhOXdwjnxMuPfzC0b4JVvjQW1CpsbM6dVRSZxEepbeyzTQV

-- Dumped from database version 15.17
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: avaliacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avaliacoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    colaborador_id uuid,
    periodo character varying(100),
    notas jsonb,
    media numeric(4,2),
    criado_em timestamp without time zone DEFAULT now()
);


--
-- Name: colaboradores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.colaboradores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    nome character varying(255) NOT NULL,
    cargo character varying(255),
    area character varying(255),
    nivel character varying(100),
    email character varying(255),
    whatsapp character varying(50),
    data_admissao date,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now()
);


--
-- Name: configuracoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    dados jsonb,
    atualizado_em timestamp without time zone DEFAULT now(),
    valores jsonb,
    matriz_comp jsonb,
    perguntas jsonb,
    niveis jsonb,
    organograma_pos jsonb,
    organograma_conn jsonb,
    gestor_config jsonb,
    historico_ia jsonb DEFAULT '[]'::jsonb,
    snapshot_cols jsonb,
    snapshot_avaliacoes jsonb,
    snapshot_metas jsonb,
    snapshot_notas jsonb,
    snapshot_pdis jsonb,
    snapshot_funcoes jsonb,
    snapshot_valores_empresa jsonb,
    snapshot_competencias jsonb,
    snapshot_niveis jsonb,
    snapshot_perguntas jsonb,
    last_save bigint,
    snapshot_areas jsonb,
    snapshot_ninebox jsonb
);


--
-- Name: funcoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funcoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    dados jsonb,
    atualizado_em timestamp without time zone DEFAULT now()
);


--
-- Name: metas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    colaborador_id uuid,
    titulo character varying(255),
    descricao text,
    prazo date,
    status character varying(50) DEFAULT 'em_andamento'::character varying,
    criado_em timestamp without time zone DEFAULT now(),
    tipo character varying(10),
    objetivo text,
    area character varying(100),
    periodo character varying(50),
    key_results jsonb DEFAULT '[]'::jsonb,
    progresso integer DEFAULT 0
);


--
-- Name: ninebox; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ninebox (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    dados jsonb,
    atualizado_em timestamp without time zone DEFAULT now(),
    colaborador_id uuid,
    desempenho integer,
    potencial integer,
    data_avaliacao date DEFAULT CURRENT_DATE
);


--
-- Name: notas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    colaborador_id uuid,
    conteudo text,
    tipo character varying(50) DEFAULT 'geral'::character varying,
    criado_em timestamp without time zone DEFAULT now()
);


--
-- Name: pdis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdis (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid,
    colaborador_id uuid,
    titulo character varying(255),
    acoes jsonb,
    status character varying(50) DEFAULT 'ativo'::character varying,
    criado_em timestamp without time zone DEFAULT now(),
    col_nome character varying(200),
    objetivo text,
    competencias jsonb DEFAULT '[]'::jsonb,
    revisoes jsonb DEFAULT '[]'::jsonb
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    plano character varying(50) DEFAULT 'trial'::character varying,
    trial_fim timestamp without time zone DEFAULT (now() + '7 days'::interval),
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now(),
    empresa character varying(255),
    segmento character varying(100),
    trial_expira timestamp without time zone DEFAULT (now() + '7 days'::interval),
    assinatura_ativa boolean DEFAULT false
);


--
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: colaboradores colaboradores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colaboradores
    ADD CONSTRAINT colaboradores_pkey PRIMARY KEY (id);


--
-- Name: configuracoes configuracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes
    ADD CONSTRAINT configuracoes_pkey PRIMARY KEY (id);


--
-- Name: configuracoes configuracoes_tenant_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes
    ADD CONSTRAINT configuracoes_tenant_id_unique UNIQUE (tenant_id);


--
-- Name: funcoes funcoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcoes
    ADD CONSTRAINT funcoes_pkey PRIMARY KEY (id);


--
-- Name: funcoes funcoes_tenant_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcoes
    ADD CONSTRAINT funcoes_tenant_id_unique UNIQUE (tenant_id);


--
-- Name: metas metas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas
    ADD CONSTRAINT metas_pkey PRIMARY KEY (id);


--
-- Name: ninebox ninebox_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ninebox
    ADD CONSTRAINT ninebox_pkey PRIMARY KEY (id);


--
-- Name: ninebox ninebox_tenant_col_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ninebox
    ADD CONSTRAINT ninebox_tenant_col_uniq UNIQUE (tenant_id, colaborador_id);


--
-- Name: notas notas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_pkey PRIMARY KEY (id);


--
-- Name: pdis pdis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdis
    ADD CONSTRAINT pdis_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_email_key UNIQUE (email);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: avaliacoes avaliacoes_colaborador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id) ON DELETE CASCADE;


--
-- Name: avaliacoes avaliacoes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: colaboradores colaboradores_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colaboradores
    ADD CONSTRAINT colaboradores_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: configuracoes configuracoes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes
    ADD CONSTRAINT configuracoes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: funcoes funcoes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcoes
    ADD CONSTRAINT funcoes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: metas metas_colaborador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas
    ADD CONSTRAINT metas_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id) ON DELETE CASCADE;


--
-- Name: metas metas_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas
    ADD CONSTRAINT metas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ninebox ninebox_colaborador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ninebox
    ADD CONSTRAINT ninebox_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id) ON DELETE CASCADE;


--
-- Name: ninebox ninebox_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ninebox
    ADD CONSTRAINT ninebox_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: notas notas_colaborador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id) ON DELETE CASCADE;


--
-- Name: notas notas_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pdis pdis_colaborador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdis
    ADD CONSTRAINT pdis_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id) ON DELETE CASCADE;


--
-- Name: pdis pdis_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdis
    ADD CONSTRAINT pdis_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict aBTfYBtwrd7fscmzyhOXdwjnxMuPfzC0b4JVvjQW1CpsbM6dVRSZxEepbeyzTQV


-- Down Migration

DROP TABLE IF EXISTS pgmigrations CASCADE;
DROP TABLE IF EXISTS configuracoes CASCADE;
DROP TABLE IF EXISTS notas CASCADE;
DROP TABLE IF EXISTS metas CASCADE;
DROP TABLE IF EXISTS pdis CASCADE;
DROP TABLE IF EXISTS funcoes CASCADE;
DROP TABLE IF EXISTS ninebox CASCADE;
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS colaboradores CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
