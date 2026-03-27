"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Data & Types
import { CustomerInfo, Product } from "@/types";
import { MOCK_PRODUCTS } from "@/data/mock";

// Hooks
import { useTeleSaleSimulation } from "@/hooks/useTeleSaleSimulation";
import { useWebSocketAudio } from "@/hooks/useWebSocketAudio";

// Components
import { WebSocketAudioRecorder } from "../src/components/molecules";

// Template
import { DashboardTemplate } from "../src/components/templates";

export default function DashboardPage() {
  const router = useRouter();

  // --- UI State ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [productSidebarOpen, setProductSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // --- Business Logic Hook ---
  const simulationState = useTeleSaleSimulation();
  
  // --- WebSocket Audio Hook ---
  const {
    transcriptions,
    information,
    interests: wsInterests,
    guide,
    products: wsProducts,
    handleTranscription,
    handleInformation,
    handleInterest,
    handleGuide,
    handleProducts,
    handleError
  } = useWebSocketAudio();
  
  const recorder = WebSocketAudioRecorder({
    onTranscription: handleTranscription,
    onInformation: (data) => {
      handleInformation(data);
      setCustomer(prev => ({ ...prev, ...data }));
    },
    onInterest: (data) => {
      handleInterest(data);
      if (data.interests) {
        setInterests(prev => ({ ...prev, ...data.interests }));
      }
    },
    onGuide: handleGuide,
    onProducts: handleProducts,
    onError: handleError
  });

  // --- Data State ---
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "คุณสมชาย ใจดี",
    age: "35",
    income: "45000",
    status: "Married",
    children: "1",
  });

  const [interests, setInterests] = useState<Record<string, boolean>>({
    "Life Insurance": true,
    "Health Insurance": false,
    "Critical Illness": false,
    "Retirement Planning": false,
    "Accident Insurance": false,
    "Tax Benefits": true,
    "Education Fund": false,
    Investment: false,
  });

  const filteredProducts = MOCK_PRODUCTS.filter((p) => interests[p.category]);

  // --- Actions ---
  const handleLogout = () => {
    simulationState.resetSimulation();
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push("/login");
  };

  const toggleInterest = (key: string) => {
    setInterests((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Live Transcription Component */}
      <div className="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg">
        {recorder.component}
        
        {/* Show latest transcription */}
        {transcriptions.length > 0 && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm max-w-xs">
            <strong>Latest:</strong> {transcriptions[transcriptions.length - 1]}
          </div>
        )}
      </div>
      
      <DashboardTemplate
      // Layout props
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      productSidebarOpen={productSidebarOpen}
      setProductSidebarOpen={setProductSidebarOpen}
      // Simulation Logic
      simulationState={simulationState}
      // Data Props
      customer={customer}
      setCustomer={setCustomer}
      interests={interests}
      toggleInterest={toggleInterest}
      filteredProducts={filteredProducts}
      transcriptions={transcriptions}
      // Actions
      actions={{
        handleLogout,
        handleMicClick: recorder.isRecording ? recorder.stopRecording : recorder.startRecording,
        setSelectedProduct,
        setShowTranscript,
        setShowLogoutConfirm,
      }}
      // Modals
      modals={{
        selectedProduct,
        showTranscript,
        showLogoutConfirm,
      }}
      />
    </>
  );
}
