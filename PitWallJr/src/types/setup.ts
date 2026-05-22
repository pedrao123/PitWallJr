export type RGB = [number, number, number];

export interface CanSignalConfig {
  baseId: number;
  offsets: {
    rpm: number;
    ect: number;
    tpsAndBatt: number;
    gear: number;
  };
  byteOffsets: {
    rpm: number;
    ect: number;
    tps: number;
    batt: number;
    gear: number;
  };
  staleMs: number;
}

export interface RobustnessConfig {
  dispFailCycles: number;
  dispReinitPeriodMs: number;
  taskWdTimeoutMs: number;
}

export interface DisplayConfig {
  periodMs: number;
  respTimeoutMs: number;
  vpAddresses: {
    rpm: number;
    gear: number;
    tps: number;
    battery: number;
    ect: number;
  };
}

export interface LedConfig {
  totalCount: number;
  heartbeatIdx: number;
  heartbeatColors: {
    ok: RGB;
    warn: RGB;
    error: RGB;
  };
}

export interface ShiftBase {
  ledStart: number;
  ledCount: number;
  colors: RGB[];
  flashColor: RGB;
  flashTicks: number;
}

export interface ShiftFixed extends ShiftBase {
  mode: 'fixed';
  rpmStart: number;
  rpmShift: number;
}

export interface ShiftGear extends ShiftBase {
  mode: 'gear';
  rpmStartByGear: [number, number, number, number, number, number, number];
  rpmShiftByGear: [number, number, number, number, number, number, number];
}

export type ShiftConfig = ShiftFixed | ShiftGear;

export interface DeviceSetup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  can: CanSignalConfig;
  robustness: RobustnessConfig;
  display: DisplayConfig;
  leds: LedConfig;
  shift: ShiftConfig;
}
