import { z } from 'zod';

const RGBSchema = z.tuple([
  z.number().int().min(0).max(255),
  z.number().int().min(0).max(255),
  z.number().int().min(0).max(255),
]);

const CanSchema = z.object({
  baseId: z.number().int().min(0).max(0x7FF, 'Base ID deve ser um CAN ID de 11 bits (0x000–0x7FF)'),
  offsets: z.object({
    rpm:       z.number().int().min(0),
    ect:       z.number().int().min(0),
    tpsAndBatt: z.number().int().min(0),
    gear:      z.number().int().min(0),
  }),
  byteOffsets: z.object({
    rpm:  z.number().int().min(0).max(7),
    ect:  z.number().int().min(0).max(7),
    tps:  z.number().int().min(0).max(7),
    batt: z.number().int().min(0).max(7),
    gear: z.number().int().min(0).max(7),
  }),
  staleMs: z.number().int().min(1, 'Stale timeout deve ser > 0'),
});

const RobustnessSchema = z.object({
  dispFailCycles:    z.number().int().min(1).max(100),
  dispReinitPeriodMs: z.number().int().min(100).max(10000),
  taskWdTimeoutMs:   z.number().int().min(100).max(5000),
});

const DisplaySchema = z.object({
  periodMs:      z.number().int().min(1),
  respTimeoutMs: z.number().int().min(1),
  vpAddresses: z.object({
    rpm:     z.number().int().min(0).max(0xFFFF),
    gear:    z.number().int().min(0).max(0xFFFF),
    tps:     z.number().int().min(0).max(0xFFFF),
    battery: z.number().int().min(0).max(0xFFFF),
    ect:     z.number().int().min(0).max(0xFFFF),
  }),
}).superRefine((d, ctx) => {
  const addrs = Object.values(d.vpAddresses);
  const unique = new Set(addrs);
  if (unique.size !== addrs.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'VP addresses devem ser únicos', path: ['vpAddresses'] });
  }
  if (d.periodMs > 200) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Period > 200 ms pode causar atraso perceptível no display', path: ['periodMs'] });
  }
});

const ShiftBaseSchema = z.object({
  ledStart:   z.number().int().min(0),
  ledCount:   z.number().int().min(1),
  colors:     z.array(RGBSchema),
  flashColor: RGBSchema,
  flashTicks: z.number().int().min(1).max(30),
});

const ShiftFixedSchema = ShiftBaseSchema.extend({
  mode:     z.literal('fixed'),
  rpmStart: z.number().int().min(0).max(20000),
  rpmShift: z.number().int().min(0).max(20000),
}).refine(
  (d) => d.rpmStart < d.rpmShift,
  { message: 'RPM start deve ser menor que RPM shift', path: ['rpmStart'] },
);

const GearArraySchema = z.tuple([
  z.literal(0),
  z.number().int().min(0).max(20000),
  z.number().int().min(0).max(20000),
  z.number().int().min(0).max(20000),
  z.number().int().min(0).max(20000),
  z.number().int().min(0).max(20000),
  z.number().int().min(0).max(20000),
]);

const ShiftGearSchema = ShiftBaseSchema.extend({
  mode:           z.literal('gear'),
  rpmStartByGear: GearArraySchema,
  rpmShiftByGear: GearArraySchema,
}).refine(
  (d) => d.rpmStartByGear.every((s, i) => i === 0 || s < d.rpmShiftByGear[i]),
  { message: 'RPM start deve ser menor que RPM shift em cada marcha', path: ['rpmStartByGear'] },
);

const ShiftSchema = z.discriminatedUnion('mode', [ShiftFixedSchema, ShiftGearSchema]);

const LedSchema = z.object({
  totalCount:   z.number().int().min(1).max(300),
  heartbeatIdx: z.number().int().min(0),
  heartbeatColors: z.object({
    ok:    RGBSchema,
    warn:  RGBSchema,
    error: RGBSchema,
  }),
}).refine(
  (d) => d.heartbeatIdx < d.totalCount,
  { message: 'heartbeatIdx deve ser menor que totalCount', path: ['heartbeatIdx'] },
);

export const DeviceSetupSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1, 'Nome obrigatório').max(64),
  description: z.string().max(256).optional(),
  createdAt:   z.string().datetime(),
  updatedAt:   z.string().datetime(),
  can:         CanSchema,
  robustness:  RobustnessSchema,
  display:     DisplaySchema,
  leds:        LedSchema,
  shift:       ShiftSchema,
}).superRefine((d, ctx) => {
  const { ledStart, ledCount } = d.shift;
  if (ledStart + ledCount > d.leds.totalCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `ledStart (${ledStart}) + ledCount (${ledCount}) excede totalCount (${d.leds.totalCount})`,
      path: ['shift', 'ledStart'],
    });
  }
  if (d.shift.colors.length !== d.shift.ledCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Número de cores (${d.shift.colors.length}) deve ser igual a ledCount (${d.shift.ledCount})`,
      path: ['shift', 'colors'],
    });
  }
});

export type DeviceSetupInput = z.input<typeof DeviceSetupSchema>;
