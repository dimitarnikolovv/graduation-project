import { PaymentMethodEnum } from '$lib/types/enums';
import z from 'zod';

export const addEntrySchema = z.object({
	atendeeEmail: z.email('Моля, въведете валиден имейл адрес.').trim(),
	firstName: z.string().min(1, 'Моля, въведете име.').trim(),
	lastName: z.string().min(1, 'Моля, въведете фамилия.').trim(),
	phone: z
		.string()
		.regex(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/, {
			error: 'Невалиден телефонен номер'
		})
		.min(8, 'Телефонният номер е твърде кратък.')
		.max(20, 'Телефонният номер е твърде дълъг.')
		.trim(),
	paymentMethod: z.enum(PaymentMethodEnum, 'Моля, изберете валиден метод на плащане.')
});

export type AddEntrySchema = z.infer<typeof addEntrySchema>;
