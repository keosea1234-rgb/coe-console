// ---------------------------------------------------------------------------
// One-off generator: world-atlas TopoJSON -> static, projected SVG path data.
//
//   npx tsx scripts/genWorldMap.ts
//
// Produces src/domain/worldGeo.ts so the runtime ships real cartographic
// geometry with ZERO map dependencies (no d3-geo / topojson at runtime).
// Each country is bucketed into one of the console's four coverage regions by
// the centroid of its largest landmass, and every ring is projected with a
// plate-carrée (equirectangular) projection cropped to drop Antarctica.
// ---------------------------------------------------------------------------
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SRC = 'https://unpkg.com/world-atlas@2/countries-110m.json';

// Projection window (degrees). Cropping the deep south removes Antarctica,
// which is visual noise on a business coverage map.
const LON_MIN = -180;
const LON_MAX = 180;
const LAT_TOP = 83;
const LAT_BOTTOM = -56;

const WORLD_W = 1000;
const PX_PER_DEG = WORLD_W / (LON_MAX - LON_MIN);
const WORLD_H = Math.round((LAT_TOP - LAT_BOTTOM) * PX_PER_DEG);

const lonToX = (lon: number) => (lon - LON_MIN) * PX_PER_DEG;
const latToY = (lat: number) => (LAT_TOP - lat) * PX_PER_DEG;
const r1 = (n: number) => Math.round(n * 10) / 10;

type Region = 'NA' | 'EMEA' | 'APAC' | 'LATAM';

interface Topo {
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: {
    countries: {
      geometries: {
        id?: string;
        type: 'Polygon' | 'MultiPolygon';
        arcs: number[][] | number[][][];
        properties?: { name?: string };
      }[];
    };
  };
}

async function main() {
  const topo: Topo = await fetch(SRC).then((r) => r.json());
  const { scale, translate } = topo.transform;

  // Decode delta-encoded arcs into absolute [lon, lat] coordinate lists.
  const arcs: [number, number][][] = topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]] as [number, number];
    });
  });

  const arcCoords = (i: number): [number, number][] =>
    i >= 0 ? arcs[i] : arcs[~i].slice().reverse();

  // Stitch a ring (list of arc indices) into one coordinate list, then "unroll"
  // longitudes so no edge jumps across the ±180° antimeridian. Without this,
  // countries that straddle the antimeridian (Russia, Fiji, Antarctica) draw a
  // horizontal tear all the way across an equirectangular map. Points pushed past
  // ±180° land just outside the viewBox and get clipped.
  const ring = (idxs: number[]): [number, number][] => {
    const pts: [number, number][] = [];
    for (const i of idxs) {
      const seg = arcCoords(i);
      pts.push(...(pts.length ? seg.slice(1) : seg));
    }
    let prev = pts.length ? pts[0][0] : 0;
    for (let k = 1; k < pts.length; k++) {
      let lon = pts[k][0];
      while (lon - prev > 180) lon -= 360;
      while (lon - prev < -180) lon += 360;
      pts[k] = [lon, pts[k][1]];
      prev = lon;
    }
    return pts;
  };

  const shoelaceArea = (pts: [number, number][]) => {
    let a = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
    }
    return a / 2;
  };

  const centroidOf = (pts: [number, number][]): [number, number] => {
    let x = 0;
    let y = 0;
    for (const [lon, lat] of pts) {
      x += lon;
      y += lat;
    }
    return [x / pts.length, y / pts.length];
  };

  // Bucket a [lon, lat] representative point into a coverage region.
  const regionFor = (lon: number, lat: number): Region | null => {
    if (lat < -55) return null; // Antarctica / deep southern ocean (cropped out)
    const americas = lon >= -170 && lon <= -25;
    if (americas) return lat >= 25 ? 'NA' : 'LATAM';
    if (lon < -170) return 'APAC'; // Aleutians / far-east Russia wrap
    if (lon >= -25 && lon < 62) return 'EMEA'; // Europe, Africa, Middle East
    return 'APAC'; // Asia + Oceania
  };

  interface Country {
    id: string;
    name: string;
    region: Region | null;
    d: string;
    cx: number;
    cy: number;
    area: number;
  }

  const countries: Country[] = [];

  for (const geom of topo.objects.countries.geometries) {
    const polys: number[][][] =
      geom.type === 'Polygon'
        ? [geom.arcs as number[][]]
        : (geom.arcs as number[][][]);

    let d = '';
    let biggest: { pts: [number, number][]; area: number } | null = null;

    for (const poly of polys) {
      poly.forEach((ringIdx, ri) => {
        const pts = ring(ringIdx);
        if (pts.length < 3) return;
        if (ri === 0) {
          const area = Math.abs(shoelaceArea(pts));
          if (!biggest || area > biggest.area) biggest = { pts, area };
        }
        // Build the SVG sub-path (1-decimal precision, drop repeats).
        let prevX = NaN;
        let prevY = NaN;
        const cmds: string[] = [];
        pts.forEach(([lon, lat], k) => {
          const px = r1(lonToX(lon));
          const py = r1(latToY(lat));
          if (px === prevX && py === prevY) return;
          cmds.push(`${k === 0 ? 'M' : 'L'}${px} ${py}`);
          prevX = px;
          prevY = py;
        });
        if (cmds.length > 2) d += cmds.join('') + 'Z';
      });
    }

    if (!d || !biggest) continue;
    const big = biggest as { pts: [number, number][]; area: number };
    const [clon, clat] = centroidOf(big.pts);
    countries.push({
      id: geom.id ?? '',
      name: geom.properties?.name ?? '',
      region: regionFor(clon, clat),
      d,
      cx: r1(lonToX(clon)),
      cy: r1(latToY(clat)),
      area: big.area,
    });
  }

  // Merged land silhouette — drives the soft ocean shadow + crisp coastline.
  // objects.land is a GeometryCollection wrapping a single MultiPolygon.
  const landRoot = (topo.objects as Record<string, { type: string; arcs?: unknown; geometries?: { type: string; arcs: unknown }[] }>).land;
  const landGeom = landRoot.geometries ? landRoot.geometries[0] : landRoot;
  const landPolys: number[][][] =
    landGeom.type === 'Polygon'
      ? [landGeom.arcs as number[][]]
      : (landGeom.arcs as number[][][]);
  let landD = '';
  for (const poly of landPolys) {
    for (const ringIdx of poly) {
      const pts = ring(ringIdx);
      if (pts.length < 3) continue;
      let prevX = NaN;
      let prevY = NaN;
      const cmds: string[] = [];
      pts.forEach(([lon, lat], k) => {
        // Integer precision is plenty for a blurred shadow silhouette.
        const px = Math.round(lonToX(lon));
        const py = Math.round(latToY(lat));
        if (px === prevX && py === prevY) return;
        cmds.push(`${k === 0 ? 'M' : 'L'}${px} ${py}`);
        prevX = px;
        prevY = py;
      });
      if (cmds.length > 2) landD += cmds.join('') + 'Z';
    }
  }

  // Area-weighted projected anchor (label/marker position) per region.
  const anchors: Record<Region, { x: number; y: number }> = {
    NA: { x: 0, y: 0 },
    EMEA: { x: 0, y: 0 },
    APAC: { x: 0, y: 0 },
    LATAM: { x: 0, y: 0 },
  };
  const weight: Record<Region, number> = { NA: 0, EMEA: 0, APAC: 0, LATAM: 0 };
  for (const c of countries) {
    if (!c.region) continue;
    anchors[c.region].x += c.cx * c.area;
    anchors[c.region].y += c.cy * c.area;
    weight[c.region] += c.area;
  }
  (Object.keys(anchors) as Region[]).forEach((reg) => {
    if (weight[reg]) {
      anchors[reg] = { x: r1(anchors[reg].x / weight[reg]), y: r1(anchors[reg].y / weight[reg]) };
    }
  });

  // Sort largest-first so small islands paint on top of big landmasses.
  countries.sort((a, b) => b.area - a.area);

  const counts = countries.reduce<Record<string, number>>((m, c) => {
    const k = c.region ?? 'none';
    m[k] = (m[k] ?? 0) + 1;
    return m;
  }, {});
  console.log('region counts', counts);
  console.log('anchors', anchors);

  const rows = countries
    .map(
      (c) =>
        `  { id: '${c.id}', name: ${JSON.stringify(c.name)}, region: ${
          c.region ? `'${c.region}'` : 'null'
        }, cx: ${c.cx}, cy: ${c.cy}, d: '${c.d}' },`,
    )
    .join('\n');

  const out = `// AUTO-GENERATED by scripts/genWorldMap.ts — do not edit by hand.
// Source: world-atlas@2 countries-110m (Natural Earth, public domain).
// Plate-carrée projection, Antarctica cropped. Regenerate: npx tsx scripts/genWorldMap.ts
import type { Region } from './constants';

export const WORLD_W = ${WORLD_W};
export const WORLD_H = ${WORLD_H};

const LON_MIN = ${LON_MIN};
const LAT_TOP = ${LAT_TOP};
const PX_PER_DEG = ${WORLD_W} / ${LON_MAX - LON_MIN};

/** Project [lon, lat] into the map's SVG coordinate space. */
export const projectLng = (lon: number) => (lon - LON_MIN) * PX_PER_DEG;
export const projectLat = (lat: number) => (LAT_TOP - lat) * PX_PER_DEG;

export interface CountryShape {
  id: string;
  name: string;
  region: Region | null;
  cx: number;
  cy: number;
  d: string;
}

/** Merged silhouette of all land (one path) — used for the ocean drop shadow. */
export const WORLD_LAND = '${landD}';

/** Area-weighted projected centroid of each region (label/marker anchor). */
export const REGION_ANCHORS: Record<Region, { x: number; y: number }> = {
  NA: { x: ${anchors.NA.x}, y: ${anchors.NA.y} },
  EMEA: { x: ${anchors.EMEA.x}, y: ${anchors.EMEA.y} },
  APAC: { x: ${anchors.APAC.x}, y: ${anchors.APAC.y} },
  LATAM: { x: ${anchors.LATAM.x}, y: ${anchors.LATAM.y} },
};

export const WORLD_COUNTRIES: CountryShape[] = [
${rows}
];
`;

  const here = dirname(fileURLToPath(import.meta.url));
  const dest = resolve(here, '../src/domain/worldGeo.ts');
  writeFileSync(dest, out, 'utf8');
  console.log(`wrote ${dest} (${(out.length / 1024).toFixed(1)} KB, ${countries.length} countries)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
