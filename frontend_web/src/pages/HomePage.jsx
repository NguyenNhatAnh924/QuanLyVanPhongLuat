import React from 'react';
// Import các mảnh ghép vào
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ServiceSection from '../components/ServiceSection';
import AboutSection from '../components/AboutSection'
import Footer from '../components/Footer';
import LawyerSection from '../components/LawyerSection';
import RequestSection from '../components/RequestSection';
import LegalChat from '../components/LegalChat';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans">

      <Navbar />
\\
      <HeroSection />

      <AboutSection/>

      <ServiceSection />

      <LawyerSection/>

      <RequestSection/>
      
      <LegalChat/>

      <Footer />
      
    </div>
  );
};

export default HomePage;