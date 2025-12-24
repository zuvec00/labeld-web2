import { functions } from "../firebaseConfig";
import { httpsCallable } from "firebase/functions";

export interface SendMailRequest {
	to: string | string[];
	subject: string;
	html?: string;
	text?: string;
	cc?: string | string[];
	bcc?: string | string[];
	from?: string;
}

export const sendMailGenericCF = async (data: SendMailRequest) => {
	try {
        const sendMail = httpsCallable<SendMailRequest, { ok: boolean }>(functions, "sendMailGeneric");
		const result = await sendMail(data);
		return result.data;
	} catch (error) {
		console.error("Error calling sendMailGeneric:", error);
		throw error;
	}
};
