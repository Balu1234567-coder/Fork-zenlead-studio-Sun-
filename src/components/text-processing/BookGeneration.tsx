import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import SimpleBookGenerator from "@/components/SimpleBookGenerator";

const BookGeneration: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <SimpleBookGenerator />
      </main>
      <Footer />
    </div>
  );
};

export default BookGeneration;
