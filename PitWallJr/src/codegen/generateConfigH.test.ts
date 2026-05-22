import { describe, it, expect } from 'vitest';
import { generateConfigH } from './generateConfigH';
import type { DeviceSetup } from '../types/setup';

const baseSetup: DeviceSetup = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Test Setup',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
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

function gen(overrides: Partial<DeviceSetup> = {}): string {
  return generateConfigH({ ...baseSetup, ...overrides });
}

describe('generateConfigH', () => {
  describe('header guards', () => {
    it('opens with #ifndef CONFIG_H', () => {
      expect(gen()).toMatch(/^#ifndef CONFIG_H\n#define CONFIG_H/);
    });

    it('closes with #endif /* CONFIG_H */', () => {
      expect(gen()).toMatch(/#endif \/\* CONFIG_H \*\/\n$/);
    });
  });

  describe('CAN section', () => {
    it('emits the correct base ID in hex', () => {
      expect(gen()).toContain('#define CFG_CAN_BASE_ID          0x05F0u');
    });

    it('emits CAN ID offsets', () => {
      const out = gen();
      expect(out).toContain('(CFG_CAN_BASE_ID + 0u)');
      expect(out).toContain('(CFG_CAN_BASE_ID + 2u)');
      expect(out).toContain('(CFG_CAN_BASE_ID + 3u)');
      expect(out).toContain('(CFG_CAN_BASE_ID + 33u)');
    });

    it('emits byte offsets', () => {
      const out = gen();
      expect(out).toContain('#define CFG_CAN_RPM_BYTE         6');
      expect(out).toContain('#define CFG_CAN_TPS_BYTE         0');
      expect(out).toContain('#define CFG_CAN_BATT_BYTE        2');
    });

    it('always emits hardcoded Megasquirt conversion macros', () => {
      const out = gen();
      expect(out).toContain('CFG_CAN_RPM_CONVERT(raw)');
      expect(out).toContain('CFG_CAN_ECT_CONVERT(raw)');
      expect(out).toContain('CFG_CAN_TPS_CONVERT(raw)');
      expect(out).toContain('CFG_CAN_BATT_CONVERT(raw)');
      expect(out).toContain('CFG_CAN_GEAR_CONVERT(raw)');
    });

    it('emits stale timeout', () => {
      expect(gen()).toContain('#define CFG_CAN_STALE_MS         500u');
    });

    it('uses a different base ID when changed', () => {
      const out = gen({ can: { ...baseSetup.can, baseId: 0x600 } });
      expect(out).toContain('0x0600u');
      expect(out).not.toContain('0x05F0u');
    });
  });

  describe('robustness section', () => {
    it('emits all three watchdog defines', () => {
      const out = gen();
      expect(out).toContain('#define CFG_DISP_FAIL_CYCLES     5u');
      expect(out).toContain('#define CFG_DISP_REINIT_PERIOD_MS  1000u');
      expect(out).toContain('#define CFG_TASK_WD_TIMEOUT_MS   500u');
    });

    it('computes watchdog total silence comment correctly', () => {
      // dispFailCycles(5) × periodMs(50) = 250 ms
      expect(gen()).toContain('250 ms total silence');
    });
  });

  describe('display section', () => {
    it('emits period and response timeout', () => {
      const out = gen();
      expect(out).toContain('#define CFG_DISPLAY_PERIOD_MS    50u');
      expect(out).toContain('#define CFG_VV_RESP_TIMEOUT_MS   200u');
    });

    it('emits VP addresses as 4-digit hex', () => {
      const out = gen();
      expect(out).toContain('#define CFG_VP_RPM               0x000Au');
      expect(out).toContain('#define CFG_VP_GEAR              0x0014u');
      expect(out).toContain('#define CFG_VP_ECT               0x0032u');
    });
  });

  describe('LED section', () => {
    it('emits totalCount and heartbeatIdx', () => {
      const out = gen();
      expect(out).toContain('#define CFG_LED_TOTAL_COUNT      5u');
      expect(out).toContain('#define CFG_HEARTBEAT_LED_IDX    0u');
    });

    it('emits heartbeat colors', () => {
      const out = gen();
      expect(out).toContain('CFG_HB_COLOR_OK');
      expect(out).toContain('CFG_HB_COLOR_WARN');
      expect(out).toContain('CFG_HB_COLOR_ERROR');
      expect(out).toContain('{   0u,  20u,   0u }');
    });
  });

  describe('shift section — gear mode', () => {
    it('selects SHIFT_MODE_GEAR', () => {
      expect(gen()).toContain('#define CFG_SHIFT_MODE           SHIFT_MODE_GEAR');
    });

    it('emits per-gear RPM arrays with neutral = 0u', () => {
      const out = gen();
      expect(out).toContain('CFG_SHIFT_RPM_START_BY_GEAR');
      expect(out).toMatch(/CFG_SHIFT_RPM_START_BY_GEAR\s+\{\s*0u,/);
      expect(out).toContain('CFG_SHIFT_RPM_SHIFT_BY_GEAR');
    });

    it('emits correct LED start and count', () => {
      const out = gen();
      expect(out).toContain('#define CFG_SHIFT_LED_START      1u');
      expect(out).toContain('#define CFG_SHIFT_LED_COUNT      4u');
    });

    it('emits one color entry per LED', () => {
      const out = gen();
      // match from CFG_SHIFT_COLORS up to the closing lone `}`
      const colorBlock = out.match(/#define CFG_SHIFT_COLORS \{[\s\S]*?\n\}/)?.[0] ?? '';
      expect(colorBlock).toContain('0x00u, 0x28u, 0x00u');
      expect(colorBlock).toContain('0x30u, 0x00u, 0x00u');
    });

    it('emits flash color as hex bytes', () => {
      const out = gen();
      expect(out).toContain('#define CFG_SHIFT_FLASH_R        0x00u');
      expect(out).toContain('#define CFG_SHIFT_FLASH_G        0x40u');
      expect(out).toContain('#define CFG_SHIFT_FLASH_B        0x00u');
    });

    it('emits flash ticks and computes Hz comment', () => {
      // 8 ticks × 50 ms × 2 = 800 ms period → 1.25 Hz
      const out = gen();
      expect(out).toContain('#define CFG_SHIFT_FLASH_TICKS    8u');
      expect(out).toContain('1.3 Hz');
    });
  });

  describe('shift section — fixed mode', () => {
    const fixedSetup: DeviceSetup = {
      ...baseSetup,
      shift: {
        mode: 'fixed',
        ledStart: 1,
        ledCount: 4,
        colors: [[0, 40, 0], [40, 20, 0], [40, 20, 0], [48, 0, 0]],
        flashColor: [0, 64, 0],
        flashTicks: 8,
        rpmStart: 5500,
        rpmShift: 7200,
      },
    };

    it('selects SHIFT_MODE_FIXED', () => {
      expect(generateConfigH(fixedSetup)).toContain('#define CFG_SHIFT_MODE           SHIFT_MODE_FIXED');
    });

    it('emits flat RPM thresholds', () => {
      const out = generateConfigH(fixedSetup);
      expect(out).toContain('#define CFG_SHIFT_RPM_START      5500u');
      expect(out).toContain('#define CFG_SHIFT_RPM_SHIFT      7200u');
    });

    it('does not emit gear arrays', () => {
      const out = generateConfigH(fixedSetup);
      expect(out).not.toContain('CFG_SHIFT_RPM_START_BY_GEAR');
      expect(out).not.toContain('CFG_SHIFT_RPM_SHIFT_BY_GEAR');
    });
  });
});
