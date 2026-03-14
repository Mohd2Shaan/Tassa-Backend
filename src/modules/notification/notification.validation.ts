import { z } from 'zod';

export const registerDeviceSchema = {
    body: z.object({
        fcmToken: z.string().min(1),
        deviceType: z.enum(['android', 'ios', 'web']).default('android'),
        deviceId: z.string().optional(),
    }),
};
