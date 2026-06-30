import assert from 'node:assert/strict';
import test from 'node:test';
import { REGIONS } from '../src/domain/constants';
import { generateEvents } from '../src/domain/generateEvents';
import {
  EMPTY_FILTERS,
  applyFilters,
  coverageMatrix,
  regionCoverageDetail,
} from '../src/domain/selectors';

type CoverageBand = 'red' | 'orange' | 'yellow' | 'green';

function coverageBand(value: number): CoverageBand {
  if (value < 0.5) return 'red';
  if (value < 0.65) return 'orange';
  if (value < 0.78) return 'yellow';
  return 'green';
}

test('generated coverage data exercises every heatmap color band', () => {
  const events = generateEvents();
  const filtered = applyFilters(events, EMPTY_FILTERS);
  const baseline = {};

  const regionBands = new Set(
    REGIONS.map((region) =>
      coverageBand(regionCoverageDetail(filtered, EMPTY_FILTERS, baseline, region).coverage),
    ),
  );

  assert.deepEqual(regionBands, new Set<CoverageBand>(['red', 'orange', 'yellow', 'green']));

  const matrixBands = new Set<CoverageBand>();
  for (const row of coverageMatrix(filtered, EMPTY_FILTERS, baseline)) {
    for (const region of REGIONS) {
      matrixBands.add(coverageBand(row.cells[region].coverage));
    }
  }

  assert.deepEqual(matrixBands, new Set<CoverageBand>(['red', 'orange', 'yellow', 'green']));
});
