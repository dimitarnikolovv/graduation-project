export function calculateTaxDetails(
	finalPrice: number,
	taxRate: number
): { taxBase: number; taxAmount: number } {
	if (taxRate < 0) {
		throw new Error('Tax rate cannot be negative.');
	}

	const taxBase = Math.round((finalPrice / (1 + taxRate / 100)) * 100) / 100;
	const taxAmount = Math.round((finalPrice - taxBase) * 100) / 100;

	return { taxBase, taxAmount };
}

// export function getNavigationPathForInvoiceByIdAndStatus(
// 	invoiceId: string,
// 	status: InvoiceStatusEnum
// ) {
// 	switch (status) {
// 		case InvoiceStatusEnum.paid:
// 			return `/invoices?id=${invoiceId}`;
// 		case InvoiceStatusEnum.proforma:
// 			return `/invoices/proformas?id=${invoiceId}`;
// 		case InvoiceStatusEnum.cancelled:
// 			return `/invoices/cancelled?id=${invoiceId}`;
// 		default:
// 			return `/invoices?id=${invoiceId}`;
// 	}
// }
