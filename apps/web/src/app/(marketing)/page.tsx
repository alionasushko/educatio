import LandingNav from "@/components/marketing/landing-nav";
import HeroSection from "@/components/marketing/hero-section";
import FeaturesSection from "@/components/marketing/features-section";
import HowItWorksSection from "@/components/marketing/how-it-works-section";
import FaqSection from "@/components/marketing/faq-section";
import LandingFooter from "@/components/marketing/landing-footer";

const LandingPage = () => {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </>
  );
};

export default LandingPage;
