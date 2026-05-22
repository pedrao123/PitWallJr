import type { DeviceSetup, RGB } from '../types/setup';

function hex(n: number, pad = 4): string {
  return '0x' + n.toString(16).toUpperCase().padStart(pad, '0');
}

function hexByte(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(2, '0');
}

function rgb(name: string, c: RGB): string {
  const pad = (v: number) => v.toString().padStart(3);
  return `#define ${name.padEnd(24)} { ${pad(c[0])}u, ${pad(c[1])}u, ${pad(c[2])}u }`;
}

export function generateConfigH(setup: DeviceSetup): string {
  const { can, robustness, display, leds, shift } = setup;

  const shiftMode = shift.mode === 'fixed' ? 'SHIFT_MODE_FIXED' : 'SHIFT_MODE_GEAR';

  const shiftThresholds =
    shift.mode === 'fixed'
      ? [
          `/* Fixed-mode thresholds */`,
          `#define CFG_SHIFT_RPM_START      ${shift.rpmStart}u`,
          `#define CFG_SHIFT_RPM_SHIFT      ${shift.rpmShift}u`,
        ].join('\n')
      : [
          `/* Gear-mode thresholds — index = gear number, 0 = neutral/off */`,
          `/*                                    N      1      2      3      4      5      6   */`,
          `#define CFG_SHIFT_RPM_START_BY_GEAR  { ${shift.rpmStartByGear.map((v) => v + 'u').join(', ')} }`,
          `#define CFG_SHIFT_RPM_SHIFT_BY_GEAR  { ${shift.rpmShiftByGear.map((v) => v + 'u').join(', ')} }`,
        ].join('\n');

  const shiftColors = shift.colors
    .map((c) => `    { ${hexByte(c[0])}u, ${hexByte(c[1])}u, ${hexByte(c[2])}u }`)
    .join(', \\\n');

  return `\
#ifndef CONFIG_H
#define CONFIG_H

#include <stdint.h>

/* ================================================================
 * CAN Signal Mapping — Megasquirt Advanced Broadcast, base ${hex(can.baseId)}
 * ================================================================ */
#define CFG_CAN_BASE_ID          ${hex(can.baseId)}u

#define CFG_CAN_ID_RPM           (CFG_CAN_BASE_ID + ${can.offsets.rpm}u)
#define CFG_CAN_ID_ECT           (CFG_CAN_BASE_ID + ${can.offsets.ect}u)
#define CFG_CAN_ID_TPS_BATT      (CFG_CAN_BASE_ID + ${can.offsets.tpsAndBatt}u)
#define CFG_CAN_ID_GEAR          (CFG_CAN_BASE_ID + ${can.offsets.gear}u)

/* Byte offsets within the 8-byte CAN frame (big-endian int16, except GEAR=int8) */
#define CFG_CAN_RPM_BYTE         ${can.byteOffsets.rpm}
#define CFG_CAN_ECT_BYTE         ${can.byteOffsets.ect}
#define CFG_CAN_TPS_BYTE         ${can.byteOffsets.tps}
#define CFG_CAN_BATT_BYTE        ${can.byteOffsets.batt}
#define CFG_CAN_GEAR_BYTE        ${can.byteOffsets.gear}

/* Conversion macros — result stored in can_field_t.value (uint32_t).
 * ECT: raw = °F×10 → integer °C.  BATT: raw = V×10 → stored V×100 (1150=11.50V). */
#define CFG_CAN_RPM_CONVERT(raw)   ((uint32_t)(uint16_t)(raw))
#define CFG_CAN_ECT_CONVERT(raw)   ((uint32_t)(int32_t)(((int32_t)(raw) - 320) * 5 / 90))
#define CFG_CAN_TPS_CONVERT(raw)   ((uint32_t)((int32_t)(raw) / 10))
#define CFG_CAN_BATT_CONVERT(raw)  ((uint32_t)((int32_t)(raw) * 10))
#define CFG_CAN_GEAR_CONVERT(raw)  ((uint32_t)(int8_t)(raw))

/* Field freshness timeout — used by staleness checks (ms) */
#define CFG_CAN_STALE_MS         ${can.staleMs}u

/* ================================================================
 * Robustness / Watchdogs
 * ================================================================ */

/* Consecutive display cycles where every vv_update_field fails before
 * the comm watchdog trips (${robustness.dispFailCycles * display.periodMs} ms total silence). */
#define CFG_DISP_FAIL_CYCLES     ${robustness.dispFailCycles}u

/* Interval between uart_transport_reset() recovery attempts (ms). */
#define CFG_DISP_REINIT_PERIOD_MS  ${robustness.dispReinitPeriodMs}u

/* Each monitored task must kick the watchdog within this window (ms). */
#define CFG_TASK_WD_TIMEOUT_MS   ${robustness.taskWdTimeoutMs}u

/* ================================================================
 * Display — Victor Vision / Proculus (UnicView AD)
 * ================================================================ */
#define CFG_DISPLAY_PERIOD_MS    ${display.periodMs}u
#define CFG_VV_RESP_TIMEOUT_MS   ${display.respTimeoutMs}u

#define CFG_VP_RPM               ${hex(display.vpAddresses.rpm)}u
#define CFG_VP_GEAR              ${hex(display.vpAddresses.gear)}u
#define CFG_VP_TPS               ${hex(display.vpAddresses.tps)}u
#define CFG_VP_BATTERY           ${hex(display.vpAddresses.battery)}u
#define CFG_VP_ECT               ${hex(display.vpAddresses.ect)}u

/* ================================================================
 * LED Strip (WS2812)
 * ================================================================ */
#define CFG_LED_TOTAL_COUNT      ${leds.totalCount}u
#define CFG_HEARTBEAT_LED_IDX    ${leds.heartbeatIdx}u

/* Heartbeat status colors {R, G, B} */
${rgb('CFG_HB_COLOR_OK', leds.heartbeatColors.ok)}
${rgb('CFG_HB_COLOR_WARN', leds.heartbeatColors.warn)}
${rgb('CFG_HB_COLOR_ERROR', leds.heartbeatColors.error)}

/* ================================================================
 * Shifting Lights
 * ================================================================ */
#define SHIFT_MODE_FIXED   0   /* single RPM threshold for all gears */
#define SHIFT_MODE_GEAR    1   /* per-gear RPM thresholds            */

#define CFG_SHIFT_MODE           ${shiftMode}

#define CFG_SHIFT_LED_START      ${shift.ledStart}u   /* first WS2812 index used for shifting */
#define CFG_SHIFT_LED_COUNT      ${shift.ledCount}u   /* number of shifting LEDs              */

${shiftThresholds}

/* Per-LED colors {R, G, B} — index 0 = lowest RPM, index ${shift.ledCount - 1} = highest */
#define CFG_SHIFT_COLORS { \\
${shiftColors} \\
}

/* Flash color when rpm >= rpm_shift */
#define CFG_SHIFT_FLASH_R        ${hexByte(shift.flashColor[0])}u
#define CFG_SHIFT_FLASH_G        ${hexByte(shift.flashColor[1])}u
#define CFG_SHIFT_FLASH_B        ${hexByte(shift.flashColor[2])}u

/* Flash half-period in heartbeat ticks (${display.periodMs} ms each → ${shift.flashTicks} ticks = ${shift.flashTicks * display.periodMs} ms ≈ ${(1000 / (shift.flashTicks * display.periodMs * 2)).toFixed(1)} Hz) */
#define CFG_SHIFT_FLASH_TICKS    ${shift.flashTicks}u

#endif /* CONFIG_H */
`;
}
