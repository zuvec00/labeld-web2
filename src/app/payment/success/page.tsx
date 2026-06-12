import PaymentReturnPage from "../PaymentReturnPage";

interface PaymentSuccessPageProps {
	searchParams: Promise<{
		reference?: string;
		trxref?: string;
	}>;
}

export default async function PaymentSuccessPage({
	searchParams,
}: PaymentSuccessPageProps) {
	const params = await searchParams;
	return (
		<PaymentReturnPage
			status="success"
			reference={params.reference || params.trxref}
		/>
	);
}
