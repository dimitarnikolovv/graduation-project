import { pgEnum } from 'drizzle-orm/pg-core';
import {
	ActionsEnum,
	AttemptStatusEnum,
	DurationUnitEnum,
	PaymentMethodEnum,
	PromoCodeTypeEnum,
	PublishedStatusEnum,
	QuestionTypeEnum,
	RefundReasonEnum,
	RefundTypeEnum,
	RolesEnum,
	VideoStatusEnum
} from '../../../types/enums';

// When changed change the enum in src/lib/enums.ts

export const roleEnum = pgEnum('role', Object.values(RolesEnum) as [string, ...string[]]);
export type RoleType = keyof typeof RolesEnum;

export const actionType = pgEnum('actions', Object.values(ActionsEnum) as [string, ...string[]]);
export type ActionType = keyof typeof ActionsEnum;

export const paymentMethodEnum = pgEnum(
	'payment_method',
	Object.values(PaymentMethodEnum) as [string, ...string[]]
);
export type PaymentMethodType = keyof typeof PaymentMethodEnum;

export const refundTypeEnum = pgEnum(
	'refund_type',
	Object.values(RefundTypeEnum) as [string, ...string[]]
);
export type RefundType = keyof typeof RefundTypeEnum;

export const refundReasonEnum = pgEnum(
	'refund_reason',
	Object.values(RefundReasonEnum) as [string, ...string[]]
);
export type RefundReason = keyof typeof RefundReasonEnum;

export const promotionalPriceDurationUnitEnum = pgEnum(
	'duration_unit',
	Object.values(DurationUnitEnum) as [string, ...string[]]
);
export type PromotionalPriceDurationUnitType = keyof typeof DurationUnitEnum;

export const promoCodeTypeEnum = pgEnum(
	'promo_code_type',
	Object.values(PromoCodeTypeEnum) as [string, ...string[]]
);
export type PromoCodeType = keyof typeof PromoCodeTypeEnum;

export const videoStatusEnum = pgEnum(
	'video_status',
	Object.values(VideoStatusEnum) as [string, ...string[]]
);

export const questionType = pgEnum(
	'question_type',
	Object.values(QuestionTypeEnum) as [string, ...string[]]
);

export const attemptStatus = pgEnum(
	'attempt_status',
	Object.values(AttemptStatusEnum) as [string, ...string[]]
);

export const publishedStatusEnum = pgEnum(
	'published_status',
	Object.values(PublishedStatusEnum) as [string, ...string[]]
);
