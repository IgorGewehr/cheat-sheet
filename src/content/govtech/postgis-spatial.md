---
title: "PostGIS para Dados Geoespaciais Municipais"
category: "govtech"
stack: ["PostgreSQL", "PostGIS", "TypeORM", "Next.js"]
tags: ["postgis", "geoespacial", "iptu", "gis", "b2g", "mapas", "sql"]
excerpt: "PostGIS em ERP municipal: calcular IPTU por área de lote, otimizar rotas de coleta, mapear zonas de risco — com queries espaciais e integração TypeORM."
---

## Visão Geral

PostGIS é a extensão geoespacial do PostgreSQL que transforma o banco relacional em um banco de dados geográfico completo. Para prefeituras, dados geoespaciais são centrais: cada lote tem coordenadas, cada rua tem geometria, cada zona de uso do solo é um polígono. PostGIS elimina a necessidade de um GIS externo para a maioria das operações municipais.

## Contexto B2G

- IPTU é calculado por área de lote — sem geometria, não há cálculo preciso
- Lei 10.257/2001 (Estatuto da Cidade) exige que planos diretores tenham base cartográfica digital
- SICAR (Sistema de Cadastro Ambiental Rural) exige georreferenciamento de imóveis rurais
- Coleta de resíduos, iluminação pública e zeladoria dependem de otimização de rotas geoespaciais
- Mapeamento de zonas de risco de enchente é obrigação legal após desastres (Lei 12.608/2012)
- Decretos de Área de Preservação Permanente requerem cálculo de buffer em rios

## Quando usar

- Cadastro técnico municipal (CTM) com lotes georreferenciados
- Cálculo de IPTU com área real de lote (não área declarada)
- Otimização de rotas de serviços públicos (coleta, zeladoria, fiscalização)
- Portal de transparência com mapas de obras e investimentos
- Análise de zonas de risco e planejamento urbano

## Trade-offs

| Aspecto | PostGIS | Banco externo (GIS dedicado) |
|---|---|---|
| Integração com dados existentes | Perfeita — mesmo banco | Requer sincronização |
| Operadores espaciais | Rico e bem documentado | Geralmente mais completo |
| Custo operacional | Zero — já usa PostgreSQL | Alto — licença + infra |
| Performance em grandes datasets | Boa com GIST index | Excelente (especializado) |
| Curva de aprendizado | Moderada — SQL familiar | Alta — software específico |

**Para prefeituras de médio porte**: PostGIS resolve 95% dos casos com zero custo adicional.

## Implementação

### 1. Instalar PostGIS e Criar Extension

```sql
-- Habilitar extensão (uma vez por banco)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;  -- Para geocoding aproximado

-- Verificar versão
SELECT PostGIS_Full_Version();
```

### 2. Migration TypeORM com Colunas Geometry

```typescript
// migrations/0045_add_geometry_to_lotes.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeometryToLotes0045 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // PostGIS não usa tipos TypeORM nativos — usar SQL direto
    await queryRunner.query(`
      ALTER TABLE lotes
        ADD COLUMN IF NOT EXISTS localizacao    GEOMETRY(POINT, 4674),
        ADD COLUMN IF NOT EXISTS perimetro      GEOMETRY(POLYGON, 4674),
        ADD COLUMN IF NOT EXISTS area_calculada NUMERIC(12, 4)
          GENERATED ALWAYS AS (
            ST_Area(perimetro::geography)
          ) STORED;
    `);
    -- SRID 4674 = SIRGAS 2000 (sistema oficial brasileiro)

    -- Índice espacial GIST (obrigatório para performance)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_lotes_localizacao
        ON lotes USING GIST (localizacao);

      CREATE INDEX IF NOT EXISTS idx_lotes_perimetro
        ON lotes USING GIST (perimetro);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE lotes
        DROP COLUMN IF EXISTS localizacao,
        DROP COLUMN IF EXISTS perimetro,
        DROP COLUMN IF EXISTS area_calculada;
    `);
  }
}
```

```typescript
// src/imoveis/entities/lote.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('lotes')
export class Lote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() inscricaoImobiliaria: string;
  @Column() logradouro: string;
  @Column('int') numero: number;

  // Colunas geometry não têm decorator nativo — usar Column com type custom
  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4674, nullable: true })
  localizacao: string | null;  // WKT ou GeoJSON string

  @Column({ type: 'geometry', spatialFeatureType: 'Polygon', srid: 4674, nullable: true })
  perimetro: string | null;

  // area_calculada é coluna GENERATED — somente leitura
  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true, insert: false, update: false })
  areaCalculada: number | null;

  @Column('numeric', { precision: 12, scale: 2 })
  valorVenalM2: number;
}
```

### 3. Queries Espaciais — Casos de Uso Municipais

#### Calcular Área Real de Lotes para IPTU

```typescript
// src/tributacao/iptu.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class IptuRepository {
  constructor(@InjectDataSource() private ds: DataSource) {}

  // Calcular IPTU usando área geodésica real do polígono (em m²)
  async calcularIptuPorZona(zonaId: string): Promise<LoteIptu[]> {
    return this.ds.query(
      `SELECT
        l.id,
        l.inscricao_imobiliaria,
        -- Área em m² usando cálculo geodésico (mais preciso que planar)
        ST_Area(l.perimetro::geography) AS area_m2,
        l.valor_venal_m2,
        ST_Area(l.perimetro::geography) * l.valor_venal_m2 AS valor_venal_total,
        -- IPTU = 0.5% do valor venal (alíquota residencial genérica)
        ST_Area(l.perimetro::geography) * l.valor_venal_m2 * 0.005 AS iptu_calculado
      FROM lotes l
      JOIN zonas_uso_solo z ON ST_Within(l.localizacao, z.perimetro)
      WHERE z.id = $1
        AND l.perimetro IS NOT NULL
      ORDER BY iptu_calculado DESC`,
      [zonaId],
    );
  }

  // Encontrar lotes dentro de um raio (ex: notificação de obra próxima)
  async lotesNoRaio(lat: number, lng: number, raioMetros: number): Promise<string[]> {
    const rows = await this.ds.query(
      `SELECT id, inscricao_imobiliaria
       FROM lotes
       WHERE ST_DWithin(
         localizacao::geography,
         ST_SetSRID(ST_MakePoint($1, $2), 4674)::geography,
         $3
       )`,
      [lng, lat, raioMetros],  // Atenção: longitude ANTES de latitude no PostGIS
    );
    return rows;
  }

  // Verificar se lote está em zona de preservação
  async verificarAreaPreservacao(loteId: string): Promise<boolean> {
    const [{ dentro }] = await this.ds.query(
      `SELECT EXISTS (
        SELECT 1 FROM areas_preservacao ap
        WHERE ST_Intersects(
          ap.perimetro,
          (SELECT perimetro FROM lotes WHERE id = $1)
        )
      ) AS dentro`,
      [loteId],
    );
    return dentro;
  }

  // Buffer de 30m em rios (APP obrigatória por lei)
  async calcularAppRio(rioId: string): Promise<string> {
    const [{ app }] = await this.ds.query(
      `SELECT ST_AsGeoJSON(
        ST_Buffer(
          (SELECT geometria FROM rios WHERE id = $1)::geography,
          30  -- 30 metros de APP para rios com largura < 10m (Código Florestal)
        )::geometry
      ) AS app`,
      [rioId],
    );
    return app;
  }
}
```

#### Otimização de Rotas de Coleta de Resíduos

```sql
-- Rota mais curta entre pontos de coleta usando pgRouting (extensão adicional)
-- CREATE EXTENSION pgrouting;

-- Ordenar pontos de coleta por proximidade (vizinho mais próximo simples)
WITH RECURSIVE rota AS (
  -- Ponto inicial: garagem da prefeitura
  SELECT
    p.id,
    p.localizacao,
    0::float AS distancia_acumulada,
    ARRAY[p.id] AS visitados
  FROM pontos_coleta p
  WHERE p.id = 'garagem-central-uuid'

  UNION ALL

  -- Próximo ponto mais próximo não visitado
  SELECT
    proximo.id,
    proximo.localizacao,
    rota.distancia_acumulada + ST_Distance(
      rota.localizacao::geography,
      proximo.localizacao::geography
    ),
    rota.visitados || proximo.id
  FROM pontos_coleta proximo
  JOIN rota ON proximo.id != ALL(rota.visitados)
  WHERE (
    SELECT COUNT(*) FROM pontos_coleta
  ) > array_length(rota.visitados, 1)
  ORDER BY ST_Distance(
    rota.localizacao::geography,
    proximo.localizacao::geography
  )
  LIMIT 1
)
SELECT * FROM rota;
```

### 4. Inserir Geometria — API NestJS

```typescript
// src/imoveis/lote.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LoteService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  async registrarLote(dto: RegistrarLoteDto): Promise<void> {
    // Aceitar GeoJSON do frontend (Leaflet/MapLibre exporta GeoJSON)
    await this.ds.query(
      `INSERT INTO lotes
         (inscricao_imobiliaria, logradouro, numero,
          localizacao, perimetro, valor_venal_m2)
       VALUES (
         $1, $2, $3,
         -- Converter GeoJSON para geometry SIRGAS 2000
         ST_SetSRID(ST_GeomFromGeoJSON($4), 4674),
         ST_SetSRID(ST_GeomFromGeoJSON($5), 4674),
         $6
       )`,
      [
        dto.inscricaoImobiliaria,
        dto.logradouro,
        dto.numero,
        JSON.stringify(dto.localizacao),     // GeoJSON Point
        JSON.stringify(dto.perimetro),       // GeoJSON Polygon
        dto.valorVenalM2,
      ],
    );
  }

  async exportarGeoJSON(zonaId: string): Promise<object> {
    const [{ geojson }] = await this.ds.query(
      `SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(perimetro)::json,
            'properties', json_build_object(
              'id', id,
              'inscricao', inscricao_imobiliaria,
              'area_m2', ST_Area(perimetro::geography)
            )
          )
        )
      ) AS geojson
      FROM lotes
      WHERE ST_Within(
        localizacao,
        (SELECT perimetro FROM zonas_uso_solo WHERE id = $1)
      )`,
      [zonaId],
    );
    return JSON.parse(geojson);
  }
}

interface RegistrarLoteDto {
  inscricaoImobiliaria: string;
  logradouro: string;
  numero: number;
  localizacao: { type: 'Point'; coordinates: [number, number] };
  perimetro: { type: 'Polygon'; coordinates: [number, number][][] };
  valorVenalM2: number;
}
```

### 5. Integração com Leaflet no Frontend Next.js

```tsx
// src/app/mapa/MapaLotes.tsx
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  featureCollection: GeoJSON.FeatureCollection;
}

export function MapaLotes({ featureCollection }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView([-23.5505, -46.6333], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);

    L.geoJSON(featureCollection, {
      style: (feature) => ({
        color: feature?.properties?.iptu_calculado > 5000 ? '#ef4444' : '#3b82f6',
        weight: 2,
        fillOpacity: 0.4,
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`
          <strong>${feature.properties.inscricao}</strong><br/>
          Área: ${feature.properties.area_m2?.toFixed(2)} m²
        `);
      },
    }).addTo(mapRef.current);

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [featureCollection]);

  return <div ref={containerRef} style={{ height: '500px', width: '100%' }} />;
}
```

## Armadilhas

- **SRID errado**: Brasil usa SIRGAS 2000 (SRID 4674). Dados importados de shapefile podem estar em Córrego Alegre (SRID 4222) ou WGS 84 (SRID 4326). Sempre converter: `ST_Transform(geom, 4674)`.
- **Cálculo planar vs geodésico**: `ST_Area(polygon)` retorna unidades do SRID (graus²!). Use `ST_Area(polygon::geography)` para metros quadrados reais.
- **Longitude antes de latitude**: PostGIS usa ordem `(longitude, latitude)` — oposta ao padrão geográfico. `ST_MakePoint(-46.63, -23.55)` → SP. Confusão garante bugs silenciosos.
- **Sem índice GIST**: Queries espaciais sem índice GIST fazem full scan. Sempre `CREATE INDEX USING GIST`.
- **Dados sem `NOT NULL`**: Lotes sem geometria quebram queries espaciais silenciosamente. Valide no import e adicione constraint quando possível.
- **GeoJSON do Leaflet vs WKT do PostGIS**: Leaflet exporta GeoJSON; PostGIS aceita ambos mas `ST_AsText` retorna WKT. Defina um padrão na API e converta na borda.

## Referências

- [PostGIS Documentation](https://postgis.net/documentation/)
- [IBGE — SIRGAS 2000](https://www.ibge.gov.br/geociencias/informacoes-sobre-posicionamento-geodesico/redes-geodesicas/16783-sirgas.html)
- [Estatuto da Cidade — Lei 10.257/2001](https://www.planalto.gov.br/ccivil_03/leis/leis_2001/l10257.htm)
- [TypeORM Spatial Support](https://typeorm.io/entities#spatial-columns)
- [LeafletJS](https://leafletjs.com/)
