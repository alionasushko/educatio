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
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FaqSection />
      <LandingFooter />
    </>
  );
};

export default LandingPage;
