import { PaymentMethodEnum } from '$lib/types/enums';
import z from 'zod';

export const addEntrySchema = z.object({
	userId: z.string('Моля, въведете валидно потребителско ID.'),
	paymentMethod: z.enum(PaymentMethodEnum, 'Моля, изберете валиден метод на плащане.')
});

export type AddEntrySchema = z.infer<typeof addEntrySchema>;
