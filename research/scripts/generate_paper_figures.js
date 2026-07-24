/*
 * Reproducible static figures for research/webPaper.qmd.
 * Uses only final state-level data and reported spatial-statistical results.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('/Users/xeniax/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const root = path.resolve(__dirname, '../..');
const figDir = path.join(root, 'research', 'figures');
const resultDir = path.join(root, 'research', 'results');
const ink = '#1f2d28';
const green = '#1c7c42';
const greenDark = '#145a32';
const greenLight = '#dce9df';
const gray = '#65736d';
const grid = '#d7e0da';
const blue = '#5f8fb4';
const orange = '#b8751f';
const white = '#ffffff';
// Figures are rasterized for a web-paper column. Scale labels up so they remain
// legible after Quarto resizes them to the reading width.
const fontScale = 1.28;
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (x, y, value, size, opts = {}) => `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size * fontScale}" font-weight="${opts.weight || 400}" fill="${opts.fill || ink}" text-anchor="${opts.anchor || 'start'}">${esc(value)}</text>`;
const lineText = (x, y, values, size, opts = {}) => values.map((value, i) => text(x, y + i * (opts.leading || size * 1.25) * fontScale, value, size, opts)).join('');
const svg = (body, width, height) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${body}</svg>`;
async function saveFigure(filename, body, width, height) {
  await sharp(Buffer.from(svg(body, width, height))).png({ compressionLevel: 9 }).withMetadata({ density: 300 }).toFile(path.join(figDir, filename));
}

const raw = fs.readFileSync(path.join(root, 'data', 'research_dataset.csv'), 'utf8').trim().split(/\r?\n/);
const headers = raw.shift().split(',');
const index = Object.fromEntries(headers.map((header, i) => [header, i]));
const rows = raw.map(line => {
  const values = line.split(',');
  const record = {};
  headers.forEach((header, i) => { record[header] = values[i]; });
  return record;
});
const numeric = (row, field) => Number(row[field]);
const riskOrder = {
  'No Expected Annual Losses': 0,
  'Very Low': 1,
  'Relatively Low': 2,
  'Relatively Moderate': 3,
  'Relatively High': 4,
  'Very High': 5,
};
const geo = JSON.parse(fs.readFileSync(path.join(root, 'data', 'final_data.geojson'), 'utf8'));
const giRows = fs.readFileSync(path.join(resultDir, 'getis_ord_gi_star_results.csv'), 'utf8').trim().split(/\r?\n/).slice(1).map(line => {
  const parts = line.split(',');
  return { state: parts[0], classification: parts[5] };
});
const rowFor = state => rows.find(row => row.State === state);

function mean(values) { return values.reduce((total, value) => total + value, 0) / values.length; }
function correlation(x, y) {
  const mx = mean(x); const my = mean(y);
  let numerator = 0; let sx = 0; let sy = 0;
  for (let i = 0; i < x.length; i += 1) {
    const dx = x[i] - mx; const dy = y[i] - my;
    numerator += dx * dy; sx += dx * dx; sy += dy * dy;
  }
  return numerator / Math.sqrt(sx * sy);
}
function betaFraction(a, b, x) {
  const maxIterations = 200;
  const epsilon = 3e-12;
  const tiny = 1e-30;
  let c = 1;
  let d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c; h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return h;
}
function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const logBt = a * Math.log(x) + b * Math.log(1 - x) - (Math.logGamma ? Math.logGamma(a) : logGamma(a)) - (Math.logGamma ? Math.logGamma(b) : logGamma(b)) + (Math.logGamma ? Math.logGamma(a + b) : logGamma(a + b));
  const bt = Math.exp(logBt);
  return x < (a + 1) / (a + b + 2) ? bt * betaFraction(a, b, x) / a : 1 - bt * betaFraction(b, a, 1 - x) / b;
}
function logGamma(z) {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  let value = z - 1; let accumulator = 0.9999999999998099;
  coefficients.forEach((coefficient, i) => { accumulator += coefficient / (value + i + 1); });
  const t = value + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (value + 0.5) * Math.log(t) - t + Math.log(accumulator);
}
function pPearson(r, n) {
  const df = n - 2;
  const t = Math.abs(r) * Math.sqrt(df / (1 - r * r));
  const x = df / (df + t * t);
  return regularizedBeta(x, df / 2, 0.5);
}
function stars(p) { return p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : ''; }
function formattedP(p) { return p < 0.001 ? '< .001' : p.toFixed(3).replace(/^0/, ''); }

const indicators = [
  { label: 'Species Density', field: 'Species_Density' },
  { label: 'Population Density', field: 'Population_Density' },
  { label: 'GDP Per Capita', field: 'GDP_Per_Capita' },
  { label: 'Urban Pressure', field: 'Urban_Pct' },
  { label: 'Protected Area Coverage', field: 'Protected_Pct' },
  { label: 'Wildfire Risk', field: 'Risk_Wildfire', ordinal: true },
  { label: 'Drought Risk', field: 'Risk_Drought', ordinal: true },
  { label: 'Flood Risk', field: 'Risk_Flooding', ordinal: true },
  { label: 'Ecological Vulnerability', field: 'Ecological_Vulnerability' },
];
const brs = rows.map(row => numeric(row, 'Biodiversity_Risk'));
const correlations = indicators.map(indicator => {
  const values = rows.map(row => indicator.ordinal ? riskOrder[row[indicator.field]] : numeric(row, indicator.field));
  const r = correlation(brs, values);
  return { Indicator: indicator.label, Pearson_r: r, p_value: pPearson(r, brs.length), sample_size: brs.length };
});

function writeResults() {
  const corrLines = ['Indicator,Pearson_r,p_value,sample_size', ...correlations.map(result => `${result.Indicator},${result.Pearson_r.toFixed(12)},${result.p_value.toFixed(12)},${result.sample_size}`)];
  fs.writeFileSync(path.join(resultDir, 'correlation_results.csv'), `${corrLines.join('\n')}\n`);
  const ranking = rows.map(row => ({ State: row.State, Risk_Score: numeric(row, 'Biodiversity_Risk') })).sort((a, b) => b.Risk_Score - a.Risk_Score).map((row, i) => ({ ...row, Rank: i + 1 }));
  const rankingLines = ['State,Risk_Score,Rank', ...ranking.map(row => `${row.State},${row.Risk_Score.toFixed(6)},${row.Rank}`)];
  fs.writeFileSync(path.join(resultDir, 'risk_ranking.csv'), `${rankingLines.join('\n')}\n`);
}

function rings(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(rings);
  return [];
}
function albersPoint(point, config) {
  const radians = Math.PI / 180;
  const phi = point[1] * radians; const lambda = point[0] * radians;
  const phi1 = config.phi1 * radians; const phi2 = config.phi2 * radians; const phi0 = config.phi0 * radians; const lambda0 = config.lambda0 * radians;
  const n = (Math.sin(phi1) + Math.sin(phi2)) / 2;
  const c = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);
  const rho = Math.sqrt(c - 2 * n * Math.sin(phi)) / n;
  const rho0 = Math.sqrt(c - 2 * n * Math.sin(phi0)) / n;
  return [rho * Math.sin(n * (lambda - lambda0)), rho0 - rho * Math.cos(n * (lambda - lambda0))];
}
function featureByState(state) { return geo.features.find(feature => feature.properties.State === state); }
function groupFitter(states, config, target) {
  const points = states.flatMap(state => rings(featureByState(state).geometry).flat().map(point => albersPoint(point, config)));
  const xs = points.map(point => point[0]); const ys = points.map(point => point[1]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const scale = Math.min(target.width / (maxX - minX), target.height / (maxY - minY));
  const padX = target.x + (target.width - (maxX - minX) * scale) / 2;
  const padY = target.y + (target.height - (maxY - minY) * scale) / 2;
  return point => { const [x, y] = albersPoint(point, config); return [padX + (x - minX) * scale, padY + (maxY - y) * scale]; };
}
const allStates = geo.features.map(feature => feature.properties.State);
const conusStates = allStates.filter(state => state !== 'Alaska' && state !== 'Hawaii');
const projectConus = groupFitter(conusStates, { phi0: 23, phi1: 29.5, phi2: 45.5, lambda0: -96 }, { x: 140, y: 105, width: 2450, height: 1350 });
const projectAlaska = groupFitter(['Alaska'], { phi0: 55, phi1: 55, phi2: 65, lambda0: -154 }, { x: 130, y: 1420, width: 520, height: 320 });
const projectHawaii = groupFitter(['Hawaii'], { phi0: 8, phi1: 8, phi2: 18, lambda0: -157 }, { x: 700, y: 1510, width: 390, height: 190 });
const stateAbbreviations = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
};
const labelOverrides = {
  Vermont: { x: 2440, y: 330 },
  'New Hampshire': { x: 2540, y: 400 },
  Massachusetts: { x: 2470, y: 475 },
  'Rhode Island': { x: 2580, y: 550 },
  Connecticut: { x: 2470, y: 625 },
  'New Jersey': { x: 2580, y: 700 },
  Delaware: { x: 2470, y: 775 },
  Maryland: { x: 2580, y: 850 },
  'District of Columbia': { x: 2470, y: 925 },
};
function projectionFor(feature) {
  return feature.properties.State === 'Alaska' ? projectAlaska : feature.properties.State === 'Hawaii' ? projectHawaii : projectConus;
}
function statePath(feature) {
  const projection = projectionFor(feature);
  return rings(feature.geometry).map(ring => ring.map((point, i) => {
    const [x, y] = projection(point); return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + 'Z').join(' ');
}
function stateCenter(feature) {
  const projected = rings(feature.geometry).flat().map(point => projectionFor(feature)(point));
  const xs = projected.map(point => point[0]); const ys = projected.map(point => point[1]);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}
function haloText(x, y, value, size, opts = {}) {
  return `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size * fontScale}" font-weight="${opts.weight || 400}" fill="${opts.fill || ink}" text-anchor="${opts.anchor || 'middle'}" paint-order="stroke" stroke="#ffffff" stroke-width="${opts.strokeWidth || 5}" stroke-linejoin="round">${esc(value)}</text>`;
}
function stateRiskLabels() {
  let body = '';
  geo.features.forEach(feature => {
    const state = feature.properties.State;
    const source = stateCenter(feature);
    const target = labelOverrides[state] || { x: source.x, y: source.y - 18 };
    if (labelOverrides[state]) {
      const elbowX = source.x + (target.x - source.x) * 0.42;
      body += `<path d="M${source.x.toFixed(1)},${source.y.toFixed(1)} L${elbowX.toFixed(1)},${source.y.toFixed(1)} L${(target.x - 22).toFixed(1)},${(target.y - 10).toFixed(1)}" fill="none" stroke="#708277" stroke-width="2.4"/>`;
    }
    const score = numeric(rowFor(state), 'Biodiversity_Risk').toFixed(1);
    body += haloText(target.x, target.y, stateAbbreviations[state], 31, { weight: 600 });
    body += haloText(target.x, target.y + 40, score, 25, { fill: '#33463c', strokeWidth: 4 });
  });
  return body;
}
function outlineMap(x, y, width, height) {
  const scale = Math.min(width / 2450, height / 1705);
  const transform = `translate(${x - 140 * scale},${y - 105 * scale}) scale(${scale})`;
  return `<g transform="${transform}">${geo.features.map(feature => `<path d="${statePath(feature)}" fill="#edf2ef" stroke="#91a298" stroke-width="${2.4 / scale}"/>`).join('')}</g>`;
}
function colorRamp(value) {
  const t = Math.max(0, Math.min(1, value / 100));
  const from = [235, 245, 237]; const to = [0, 109, 44];
  const rgb = from.map((channel, i) => Math.round(channel + (to[i] - channel) * t));
  return `rgb(${rgb.join(',')})`;
}

function riskMapFigure() {
  let body = '';
  body += text(170, 68, 'Biodiversity Risk Score by State', 42, { weight: 600 });
  geo.features.forEach(feature => {
    const score = numeric(rowFor(feature.properties.State), 'Biodiversity_Risk');
    body += `<path d="${statePath(feature)}" fill="${colorRamp(score)}" stroke="#6f8478" stroke-width="2.2"/>`;
  });
  body += stateRiskLabels();
  body += text(2750, 420, 'Biodiversity Risk Score', 29, { weight: 600 });
  for (let i = 0; i < 5; i += 1) {
    const value = i * 25;
    body += `<rect x="2760" y="${475 + (4 - i) * 82}" width="55" height="82" fill="${colorRamp(value)}"/>`;
    body += text(2840, 530 + (4 - i) * 82, String(value), 25, { fill: gray });
  }
  body += `<rect x="2760" y="475" width="55" height="410" fill="none" stroke="#72867b" stroke-width="2"/>`;
  body += text(2760, 950, '0–100 composite scale', 23, { fill: gray });
  return saveFigure('biodiversity_risk_map.png', body, 3300, 1820);
}

function correlationColor(value) {
  const negative = [146, 160, 151]; const neutral = [244, 248, 245]; const positive = [28, 124, 66];
  const t = value < 0 ? value + 1 : value;
  const from = value < 0 ? negative : neutral;
  const to = value < 0 ? neutral : positive;
  const rgb = from.map((channel, i) => Math.round(channel + (to[i] - channel) * t));
  return `rgb(${rgb.join(',')})`;
}

function coefficientFigure() {
  const core = [
    { label: ['Biodiversity', 'Risk Score'], field: 'Biodiversity_Risk' },
    { label: ['Species', 'Density'], field: 'Species_Density' },
    { label: ['Human', 'Pressure'], field: 'Human_Pressure' },
    { label: ['Protection', 'Ratio (PR)'], field: 'Protected_Pct' },
    { label: ['Climate', 'Vulnerability', '(CV)'], field: 'Ecological_Vulnerability' },
  ];
  const values = core.map(item => rows.map(row => numeric(row, item.field)));
  const matrix = core.map((_, row) => core.map((__, col) => {
    const r = correlation(values[row], values[col]);
    return { r, p: row === col ? null : pPearson(r, rows.length) };
  }));
  const width = 2700; const height = 2200; const cell = 300; const left = 600; const top = 390;
  let body = '';
  core.forEach((item, i) => {
    const center = left + i * cell + cell / 2;
    const labelLeading = 37 * fontScale;
    const verticalCenter = top + i * cell + cell / 2 + 12;
    body += lineText(center, 80, item.label, 31, { weight: 600, anchor: 'middle', leading: 37 });
    body += lineText(left - 48, verticalCenter - (item.label.length - 1) * labelLeading / 2, item.label, 31, { weight: 600, anchor: 'end', leading: 37 });
  });
  matrix.forEach((row, i) => row.forEach((item, j) => {
    const x = left + j * cell; const y = top + i * cell;
    const lower = i >= j;
    body += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${lower ? correlationColor(item.r) : '#f3f6f4'}" stroke="#ffffff" stroke-width="4"/>`;
    if (lower) {
      const label = i === j ? '1.000' : `${item.r.toFixed(3)}${stars(item.p)}`;
      body += text(x + cell / 2, y + cell / 2 + 13, label, 38, { weight: 600, anchor: 'middle', fill: item.r >= 0.4 ? white : ink });
    }
  }));
  const legendX = 790; const legendY = 2030; const legendWidth = 1050;
  for (let i = 0; i < 70; i += 1) {
    const value = -1 + (i / 69) * 2;
    body += `<rect x="${legendX + i * legendWidth / 70}" y="${legendY}" width="${legendWidth / 70 + 1}" height="40" fill="${correlationColor(value)}"/>`;
  }
  body += `<rect x="${legendX}" y="${legendY}" width="${legendWidth}" height="40" fill="none" stroke="#8a9a91" stroke-width="2"/>`;
  body += text(legendX, 1970, 'Pearson correlation coefficient (r)', 29, { fill: gray });
  [-1, 0, 1].forEach(value => body += text(legendX + (value + 1) / 2 * legendWidth, 2132, value === 1 ? '+1' : String(value), 27, { fill: gray, anchor: 'middle' }));
  return saveFigure('correlation_analysis.png', body, width, height);
}

function adjacency() {
  const pointSets = geo.features.map(feature => {
    const set = new Set();
    rings(feature.geometry).flat().forEach(point => set.add(`${point[0].toFixed(7)},${point[1].toFixed(7)}`));
    return set;
  });
  const neighbors = pointSets.map(() => []);
  for (let i = 0; i < pointSets.length; i += 1) {
    for (let j = i + 1; j < pointSets.length; j += 1) {
      const [small, large] = pointSets[i].size < pointSets[j].size ? [pointSets[i], pointSets[j]] : [pointSets[j], pointSets[i]];
      let shared = false;
      for (const point of small) { if (large.has(point)) { shared = true; break; } }
      if (shared) { neighbors[i].push(j); neighbors[j].push(i); }
    }
  }
  return neighbors;
}
function moranFigure() {
  const neighbors = adjacency();
  const scores = geo.features.map(feature => numeric(rowFor(feature.properties.State), 'Biodiversity_Risk'));
  const scoreMean = mean(scores); const sd = Math.sqrt(scores.reduce((sum, value) => sum + (value - scoreMean) ** 2, 0) / scores.length);
  const z = scores.map(value => (value - scoreMean) / sd);
  const lag = neighbors.map((list, i) => list.length ? mean(list.map(j => z[j])) : null);
  const usable = lag.map((value, i) => value === null ? null : { z: z[i], lag: value, state: geo.features[i].properties.State }).filter(Boolean);
  const xMin = -2.3; const xMax = 4.5; const yMin = -1.8; const yMax = 2.3;
  const sx = value => 420 + (value - xMin) / (xMax - xMin) * 2560;
  const sy = value => 1560 - (value - yMin) / (yMax - yMin) * 1240;
  let body = '';
  [-2, 0, 2, 4].forEach(tick => { body += `<line x1="${sx(tick)}" y1="320" x2="${sx(tick)}" y2="1560" stroke="${tick === 0 ? '#8b9891' : grid}" stroke-width="${tick === 0 ? 3 : 2}" ${tick === 0 ? 'stroke-dasharray="9 8"' : ''}/>`; body += text(sx(tick), 1625, String(tick), 24, { fill: gray, anchor: 'middle' }); });
  [-1, 0, 1, 2].forEach(tick => { body += `<line x1="420" y1="${sy(tick)}" x2="2980" y2="${sy(tick)}" stroke="${tick === 0 ? '#8b9891' : grid}" stroke-width="${tick === 0 ? 3 : 2}" ${tick === 0 ? 'stroke-dasharray="9 8"' : ''}/>`; body += text(370, sy(tick) + 9, String(tick), 24, { fill: gray, anchor: 'end' }); });
  const slope = 0.145671;
  body += `<line x1="${sx(xMin)}" y1="${sy(slope * xMin)}" x2="${sx(xMax)}" y2="${sy(slope * xMax)}" stroke="${greenDark}" stroke-width="6"/>`;
  usable.forEach(point => { body += `<circle cx="${sx(point.z)}" cy="${sy(point.lag)}" r="10" fill="${green}" fill-opacity="0.72"/>`; });
  const isolated = [{ state: 'Alaska', symbol: '△' }, { state: 'Hawaii', symbol: '□' }];
  isolated.forEach((item, i) => { const ix = geo.features.findIndex(feature => feature.properties.State === item.state); body += text(sx(z[ix]), sy(0) - 16 - i * 26, item.symbol, 30, { fill: orange, weight: 600, anchor: 'middle' }); });
  body += text(420, 210, 'Global Moran’s I scatterplot', 35, { weight: 600 });
  body += text(1660, 210, '● Queen-contiguous states   △/□ isolates', 25, { fill: gray });
  body += `<rect x="2180" y="360" width="650" height="245" fill="#ffffff" stroke="${grid}" stroke-width="3"/>`;
  body += text(2230, 425, 'Observed Moran’s I', 25, { fill: gray });
  body += text(2780, 425, '0.146', 30, { weight: 600, anchor: 'end' });
  body += text(2230, 495, 'Upper-tail permutation p', 25, { fill: gray });
  body += text(2780, 495, '.037', 30, { weight: 600, anchor: 'end' });
  body += text(2230, 565, 'Expected I', 25, { fill: gray });
  body += text(2780, 565, '−0.020', 30, { weight: 600, anchor: 'end' });
  body += text(1700, 1735, 'Standardized Biodiversity Risk Score', 29, { fill: ink, anchor: 'middle' });
  body += `<text x="95" y="950" font-family="Helvetica, Arial, sans-serif" font-size="${29 * fontScale}" fill="${ink}" text-anchor="middle" transform="rotate(-90 95 950)">Spatial lag of standardized score</text>`;
  return saveFigure('morans_I_plot.png', body, 3300, 1840);
}

function hotspotMapFigure() {
  const classes = Object.fromEntries(giRows.map(row => [row.state, row.classification]));
  const colors = {
    'Nominal hotspot (unadjusted p < .05)': green,
    'Nominal coldspot (unadjusted p < .05)': blue,
    'Not significant': '#edf2ef',
    'Not assessed (no Queen-contiguous neighbors)': '#ffffff',
  };
  let body = `<defs><pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="#9aa9a0" stroke-width="4"/></pattern></defs>`;
  body += text(170, 68, 'Getis–Ord Gi* Local Cluster Classification', 42, { weight: 600 });
  geo.features.forEach(feature => {
    const cls = classes[feature.properties.State];
    const fill = cls === 'Not assessed (no Queen-contiguous neighbors)' ? 'url(#hatch)' : colors[cls];
    body += `<path d="${statePath(feature)}" fill="${fill}" stroke="#7f9387" stroke-width="2.2"/>`;
  });
  body += stateRiskLabels();
  const legend = [
    ['Nominal high-value cluster', green],
    ['Nominal low-value cluster', blue],
    ['Not significant', '#edf2ef'],
    ['Not assessed', 'url(#hatch)'],
  ];
  legend.forEach((item, i) => {
    const y = 475 + i * 85;
    body += `<rect x="2740" y="${y}" width="48" height="48" fill="${item[1]}" stroke="#7f9387" stroke-width="2"/>`;
    body += text(2815, y + 34, item[0], 25, { fill: ink });
  });
  return saveFigure('getis_ord_gi_star_hotspot_map.png', body, 3300, 1820);
}

function workflowFigure() {
  let body = '';
  const columns = [250, 1280, 2320];
  ['Spatial overview', 'State comparison', 'State detail'].forEach((label, i) => body += text(columns[i] + 360, 160, label, 37, { weight: 600, anchor: 'middle' }));
  body += `<path d="M1060,650 L1190,650 M1150,610 L1190,650 L1150,690" fill="none" stroke="${greenDark}" stroke-width="7"/>`;
  body += `<path d="M2090,650 L2220,650 M2180,610 L2220,650 L2180,690" fill="none" stroke="${greenDark}" stroke-width="7"/>`;
  body += outlineMap(220, 250, 780, 670);
  body += text(610, 980, 'Map and legend', 27, { fill: gray, anchor: 'middle' });
  body += text(1280, 285, 'Ranked states', 29, { weight: 600 });
  [390, 505, 620, 735, 850].forEach((y, i) => {
    body += text(1280, y + 8, String(i + 1), 26, { fill: gray });
    body += `<line x1="1350" y1="${y}" x2="1990" y2="${y}" stroke="${greenLight}" stroke-width="22" stroke-linecap="round"/>`;
    body += `<line x1="1350" y1="${y}" x2="${1830 - i * 75}" y2="${y}" stroke="${green}" stroke-width="22" stroke-linecap="round"/>`;
  });
  body += text(2320, 285, 'Selected-state indicators', 29, { weight: 600 });
  ['BRS', 'Human pressure', 'Climate vulnerability', 'Protection ratio'].forEach((metric, i) => {
    const y = 390 + i * 145;
    body += text(2320, y, metric, 25, { fill: ink });
    body += `<line x1="2320" y1="${y + 35}" x2="3150" y2="${y + 35}" stroke="${greenLight}" stroke-width="22" stroke-linecap="round"/>`;
  });
  return saveFigure('interactive_exploration_framework.png', body, 3600, 1150);
}

function architectureFigure() {
  let body = '';
  body += `<rect x="120" y="120" width="3160" height="1510" fill="#ffffff" stroke="${grid}" stroke-width="3"/>`;
  body += `<rect x="170" y="180" width="470" height="1390" fill="#f4f7f5" stroke="${grid}" stroke-width="3"/>`;
  body += text(220, 270, 'Control rail', 31, { weight: 600 });
  ['Analysis mode', 'Variable', 'Ranking filter', 'Search state'].forEach((label, i) => {
    const y = 390 + i * 190;
    body += text(220, y, label, 25, { fill: ink });
    body += `<rect x="220" y="${y + 35}" width="360" height="55" fill="#ffffff" stroke="${grid}" stroke-width="3"/>`;
  });
  body += `<rect x="690" y="180" width="1540" height="820" fill="#ffffff" stroke="${grid}" stroke-width="3"/>`;
  body += text(740, 270, 'Spatial canvas', 31, { weight: 600 });
  body += outlineMap(770, 340, 1360, 590);
  body += `<rect x="2280" y="180" width="950" height="820" fill="#ffffff" stroke="${grid}" stroke-width="3"/>`;
  body += text(2330, 270, 'State report', 31, { weight: 600 });
  ['Selected state', 'Risk summary', 'Indicator profile', 'Context notes'].forEach((label, i) => {
    const y = 385 + i * 135;
    body += text(2330, y, label, 25, { fill: ink });
    body += `<line x1="2330" y1="${y + 40}" x2="3150" y2="${y + 40}" stroke="${greenLight}" stroke-width="18" stroke-linecap="round"/>`;
  });
  body += `<rect x="690" y="1050" width="2540" height="520" fill="#ffffff" stroke="${grid}" stroke-width="3"/>`;
  body += text(740, 1140, 'Ranking and comparison workspace', 31, { weight: 600 });
  [1260, 1350, 1440].forEach((y, i) => {
    body += `<line x1="790" y1="${y}" x2="${1660 - i * 155}" y2="${y}" stroke="${green}" stroke-width="24" stroke-linecap="round"/>`;
    body += `<line x1="1880" y1="${y - 22}" x2="3080" y2="${y - 22}" stroke="${grid}" stroke-width="3"/>`;
    body += `<line x1="1880" y1="${y + 28}" x2="2860" y2="${y + 28}" stroke="${grid}" stroke-width="3"/>`;
  });
  return saveFigure('overview_comparison_detail.png', body, 3400, 1750);
}

function regionalFigure() {
  const states = [
    { name: 'California', color: '#8cc7a0', row: rowFor('California') },
    { name: 'Florida', color: '#4e9d6a', row: rowFor('Florida') },
    { name: 'Texas', color: '#176d3b', row: rowFor('Texas') },
  ];
  const dimensions = [
    ['Biodiversity Risk Score', 'Biodiversity_Risk'], ['Human Pressure', 'Human_Pressure'], ['Climate Vulnerability', 'Ecological_Vulnerability'], ['Protected Area Coverage', 'Protected_Pct'],
  ];
  const axisX = [520, 1320, 2120, 2920]; const top = 250; const bottom = 1420;
  const norm = (field, value) => {
    const all = states.map(state => numeric(state.row, field)); const min = Math.min(...all); const max = Math.max(...all);
    return bottom - (value - min) / (max - min) * (bottom - top);
  };
  let body = '';
  dimensions.forEach((dimension, i) => {
    body += lineText(axisX[i], 105, dimension[0].split(' '), 28, { weight: 600, anchor: 'middle', leading: 34 });
    body += `<line x1="${axisX[i]}" y1="${top}" x2="${axisX[i]}" y2="${bottom}" stroke="#9cadA3" stroke-width="3"/>`;
    body += text(axisX[i], top - 24, 'High', 23, { fill: gray, anchor: 'middle' });
    body += text(axisX[i], bottom + 42, 'Low', 23, { fill: gray, anchor: 'middle' });
  });
  states.forEach(state => {
    const points = dimensions.map((dimension, i) => `${axisX[i]},${norm(dimension[1], numeric(state.row, dimension[1]))}`).join(' ');
    body += `<polyline points="${points}" fill="none" stroke="${state.color}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
    dimensions.forEach((dimension, i) => body += `<circle cx="${axisX[i]}" cy="${norm(dimension[1], numeric(state.row, dimension[1]))}" r="14" fill="${state.color}" stroke="#ffffff" stroke-width="4"/>`);
  });
  states.forEach((state, i) => { const x = 900 + i * 650; body += `<line x1="${x}" y1="1590" x2="${x + 90}" y2="1590" stroke="${state.color}" stroke-width="10" stroke-linecap="round"/>`; body += text(x + 115, 1600, state.name, 27, { fill: ink }); });
  return saveFigure('regional_parallel_profiles.png', body, 3400, 1720);
}

function synthesisFigure() {
  const four = correlations.filter(result => ['Species Density', 'Urban Pressure', 'Protected Area Coverage', 'Ecological Vulnerability'].includes(result.Indicator));
  let body = '';
  body += text(170, 130, 'Statistical evidence', 35, { weight: 600 });
  body += text(2020, 130, 'Interpretation', 35, { weight: 600 });
  body += `<line x1="1800" y1="70" x2="1800" y2="1510" stroke="${grid}" stroke-width="3"/>`;
  const sx = value => 720 + (value + .5) / 1.5 * 820;
  [-.5, 0, .5, 1].forEach(tick => { body += `<line x1="${sx(tick)}" y1="230" x2="${sx(tick)}" y2="960" stroke="${tick === 0 ? '#8b9891' : grid}" stroke-width="${tick === 0 ? 3 : 2}" ${tick === 0 ? 'stroke-dasharray="8 8"' : ''}/>`; body += text(sx(tick), 1010, tick === 1 ? '1.0' : tick.toFixed(1), 24, { fill: gray, anchor: 'middle' }); });
  four.forEach((result, i) => { const y = 350 + i * 145; body += text(660, y + 8, result.Indicator, 27, { fill: ink, anchor: 'end' }); body += `<line x1="${sx(0)}" y1="${y}" x2="${sx(result.Pearson_r)}" y2="${y}" stroke="${result.Pearson_r >= 0 ? green : orange}" stroke-width="6"/>`; body += `<circle cx="${sx(result.Pearson_r)}" cy="${y}" r="15" fill="${result.Pearson_r >= 0 ? greenDark : orange}"/>`; });
  body += text(720, 1090, 'Pearson r with BRS', 27, { fill: ink });
  body += `<line x1="720" y1="1210" x2="1500" y2="1210" stroke="${grid}" stroke-width="9" stroke-linecap="round"/>`;
  body += `<line x1="${720 + (.146 + .05) / .25 * 780}" y1="1160" x2="${720 + (.146 + .05) / .25 * 780}" y2="1260" stroke="${greenDark}" stroke-width="7"/>`;
  body += text(720, 1320, 'Global Moran’s I = 0.146; p = .037 (upper-tailed)', 27, { fill: ink });
  const interpretation = [
    ['High-risk regions', 'Use BRS as a state-level screening measure.'],
    ['State comparison', 'Compare indicator profiles in geographic context.'],
    ['Conservation implications', 'Interpret nominal local patterns cautiously.'],
  ];
  interpretation.forEach((item, i) => { const y = 370 + i * 340; body += `<line x1="2020" y1="${y - 20}" x2="3190" y2="${y - 20}" stroke="${grid}" stroke-width="3"/>`; body += text(2020, y + 20, item[0], 31, { weight: 600 }); body += text(2020, y + 72, item[1], 27, { fill: gray }); });
  return saveFigure('statistical_evidence_synthesis.png', body, 3400, 1600);
}

async function main() {
  writeResults();
  await riskMapFigure();
  await coefficientFigure();
  await moranFigure();
  await hotspotMapFigure();
  await workflowFigure();
  await architectureFigure();
  await regionalFigure();
  await synthesisFigure();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
