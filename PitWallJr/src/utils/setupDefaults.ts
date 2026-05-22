import type { DeviceSetup } from '../types/setup';

export function createDefaultSetup(name: string): DeviceSetup {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    can: {
      baseId: 0x5F0,
      offsets: { rpm: 0, ect: 2, tpsAndBatt: 3, gear: 33 },
      byteOffsets: { rpm: 6, ect: 6, tps: 0, batt: 2, gear: 6 },
      staleMs: 500,
    },
    robustness: {
      dispFailCycles: 5,
      dispReinitPeriodMs: 1000,
      taskWdTimeoutMs: 500,
    },
    display: {
      periodMs: 50,
      respTimeoutMs: 200,
      vpAddresses: { rpm: 0x000A, gear: 0x0014, tps: 0x001E, battery: 0x0028, ect: 0x0032 },
    },
    leds: {
      totalCount: 5,
      heartbeatIdx: 0,
      heartbeatColors: {
        ok:    [0, 20, 0],
        warn:  [20, 12, 0],
        error: [20, 0, 0],
      },
    },
    shift: {
      mode: 'gear',
      ledStart: 1,
      ledCount: 4,
      colors: [
        [0x00, 0x28, 0x00],
        [0x28, 0x14, 0x00],
        [0x28, 0x14, 0x00],
        [0x30, 0x00, 0x00],
      ],
      flashColor: [0x00, 0x40, 0x00],
      flashTicks: 8,
      rpmStartByGear: [0, 4500, 5000, 11000, 5800, 6000, 6200],
      rpmShiftByGear: [0, 6500, 6800, 12000, 7200, 7200, 7200],
    },
  };
}
