import React from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Audience from "./Audience";
import Problem from "./Problem";
import Features from "./Features";
import VisualProof from "./VisualProof";
import StudioBrands from "./StudioBrands";
import Pricing from "./Pricing";
import FAQ from "./FAQ";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";

const LandingPage = () => {
	return (
		<main className="min-h-screen bg-bg">
			<Navbar />
			<Hero />
			<Audience />
			<Problem />
			<Features />
			<VisualProof />
			<StudioBrands />
			<Pricing />
			<FAQ />
			<FinalCTA />
			<Footer />
		</main>
	);
};

export default LandingPage;
