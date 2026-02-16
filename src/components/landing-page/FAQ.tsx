"use client";

import { motion } from "framer-motion";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
	{
		question: "What is Labeld Studio?",
		answer:
			"Labeld Studio is a culture-first platform for independent brands, event organizers, and creative communities. Build your digital presence, sell products, host events, and manage everything from one dashboard.",
	},
	{
		question: "Can I sell products and host events from the same platform?",
		answer:
			"Yes. That's the whole point. Products, events, ticketing, payments, and analytics — all unified under one roof.",
	},
	{
		question: "How is Labeld different from Bumpa, Shopify or Tix?",
		answer:
			"Those platforms are built for mass-market. Labeld is built for culture. We prioritize identity, creative control, and the unique needs of independent brands and organizers.",
	},
	{
		question: "How do I get paid?",
		answer:
			"Directly to your bank account. We process all payments securely and automatically settle funds to your Nigerian bank account based on your preferred payout schedule.",
	},
	{
		question: "Are there transaction fees?",
		answer:
			"On the Free plan, we take a small percentage per sale. On the Pro plan, we charge 0% platform fees on your personal storefront sales (standard payment gateway charges still apply).",
	},
	{
		question: "How do I scan tickets at my event?",
		answer:
			"Every ticket buyer receives a unique QR code via email. You can scan and verify tickets directly from the Labeld Studio platform using any device with a camera.",
	},
	{
		question: "Do you handle delivery for product sales?",
		answer:
			"You are in full control of your fulfillment. We provide you with all the order details and customer shipping info you need to dispatch your products.",
	},
	{
		question: "Can I use my own domain?",
		answer:
			"You can customize your unique Labeld link (e.g., yourbrand.labeld.app) to match your identity. While we don't support external custom domains (like .com) just yet, your Labeld subdomain is yours to own and share.",
	},
];

const FAQ = () => {
	return (
		<section id="faq" className="py-32 px-6">
			<div className="mx-auto max-w-2xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
					className="mb-12 text-center"
				>
					<h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
						Questions?
					</h2>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7, delay: 0.1 }}
				>
					<Accordion type="single" collapsible className="space-y-2">
						{faqs.map((faq, i) => (
							<AccordionItem
								key={i}
								value={`item-${i}`}
								className="rounded-xs border border-border bg-surface px-6 data-[state=open]:border-cta/30"
							>
								<AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-5">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="font-body text-sm leading-relaxed text-muted-foreground pb-5">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</motion.div>
			</div>
		</section>
	);
};

export default FAQ;
