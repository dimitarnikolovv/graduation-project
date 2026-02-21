import z from 'zod';

export const registerForEventSchema = z.object({
	atendeeEmail: z.email('Моля, въведете валиден имейл адрес.'),
	firstName: z.string('Моля, въведете вашето име.'),
	lastName: z.string('Моля, въведете вашето фамилно име.'),
	phone: z
		.string()
		.regex(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/, {
			error: 'Невалиден телефонен номер'
		})
		.min(8, 'Телефонният номер е твърде кратък.')
		.max(20, 'Телефонният номер е твърде дълъг.')
		.trim()
});

export type RegisterForEventSchema = z.infer<typeof registerForEventSchema>;
