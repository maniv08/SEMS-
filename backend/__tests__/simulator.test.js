import { generateReadings } from '../src/simulator/generator.js';

describe('Simulator Generator', () => {
  it('generates correct number of records for 90 days', () => {
    const start = new Date('2026-07-01T00:00:00Z');
    const end = new Date('2026-09-28T23:00:00Z'); // exactly 90 days (2160 hours)
    
    const readings = generateReadings({
      unitId: '000000000000000000000001',
      unitType: 'residential',
      startUtc: start,
      endUtc: end,
    });

    expect(readings.length).toBe(2160);
  });

  it('is deterministic given the same seed (unitId)', () => {
    const start = new Date('2026-07-01T00:00:00Z');
    const end = new Date('2026-07-01T23:00:00Z'); // 24 hours
    
    const readings1 = generateReadings({
      unitId: '00000000000000000000abcd',
      unitType: 'commercial',
      startUtc: start,
      endUtc: end,
    });

    const readings2 = generateReadings({
      unitId: '00000000000000000000abcd',
      unitType: 'commercial',
      startUtc: start,
      endUtc: end,
    });

    expect(readings1).toEqual(readings2);
  });

  it('generates anomalies correctly', () => {
    const start = new Date('2026-07-01T00:00:00Z');
    // Generates up to 100 hours
    const end = new Date(start.getTime() + 100 * 3600000); 
    
    const readings = generateReadings({
      unitId: '000000000000000000000001',
      unitType: 'residential',
      startUtc: start,
      endUtc: end,
    });

    // anomalyHoursOffset includes 72
    const anomalyReading = readings[72];
    expect(anomalyReading.isAnomaly).toBe(true);
    expect(anomalyReading.kwh).toBeGreaterThan(0);
  });
});
