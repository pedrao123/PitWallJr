import type { DeviceSetup } from '../types/setup';
import { DeviceSetupSchema } from '../schemas/setupSchema';

export function exportSetup(setup: DeviceSetup): string {
  return JSON.stringify(setup, null, 2);
}

export function importSetup(json: string): DeviceSetup {
  const data: unknown = JSON.parse(json);
  return DeviceSetupSchema.parse(data);
}
