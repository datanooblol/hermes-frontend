'use client';

import { useState, useCallback } from 'react';

export const useWebSocketAudio = () => {
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [information, setInformation] = useState<any>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [guide, setGuide] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleTranscription = useCallback((text: string) => {
    setTranscriptions(prev => [...prev, text]);
  }, []);

  const handleInformation = useCallback((data: any) => {
    setInformation(data);
  }, []);

  const handleInterest = useCallback((data: any) => {
    setInterests(prev => [...prev, data]);
  }, []);

  const handleGuide = useCallback((data: any) => {
    setGuide(data);
  }, []);

  const handleProducts = useCallback((data: any) => {
    setProducts(data);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    transcriptions,
    information,
    interests,
    guide,
    products,
    error,
    handleTranscription,
    handleInformation,
    handleInterest,
    handleGuide,
    handleProducts,
    handleError,
    clearError
  };
};