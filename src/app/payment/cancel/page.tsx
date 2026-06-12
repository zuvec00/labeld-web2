import PaymentReturnPage from "../PaymentReturnPage";

interface PaymentCancelPageProps {
	searchParams: Promise<{
		reference?: string;
		trxref?: string;
	}>;
}

export default async function PaymentCancelPage({
	searchParams,
}: PaymentCancelPageProps) {
	const params = await searchParams;
	return (
		<PaymentReturnPage
			status="cancel"
			reference={params.reference || params.trxref}
		/>
	);
}
