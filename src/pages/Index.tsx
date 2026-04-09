import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import ProblemaSection from "@/components/ProblemaSection";
import HistorialSection from "@/components/HistorialSection";
import ComoFunciona from "@/components/ComoFunciona";
import PricingSection from "@/components/PricingSection";
import ComparisonTable from "@/components/ComparisonTable";
import TestimonialsSection from "@/components/TestimonialsSection";
import DealersSection from "@/components/DealersSection";
import GestoresSection from "@/components/GestoresSection";
import SolicitudForm from "@/components/SolicitudForm";
import FAQSection from "@/components/FAQSection";
import BlogSection from "@/components/BlogSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => (
  <>
    <Navbar />
    <main>
      <HeroSection />
      <TrustBar />
      <ProblemaSection />
      <HistorialSection />
      <ComoFunciona />
      <PricingSection />
      <ComparisonTable />
      <TestimonialsSection />
      <DealersSection />
      <GestoresSection />
      <SolicitudForm />
      <FAQSection />
      <BlogSection />
    </main>
    <Footer />
    <WhatsAppButton />
  </>
);

export default Index;
