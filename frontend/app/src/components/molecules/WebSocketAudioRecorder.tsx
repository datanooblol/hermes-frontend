'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../atoms';

interface WebSocketAudioRecorderProps {
  onTranscription?: (text: string) => void;
  onInformation?: (data: any) => void;
  onInterest?: (data: any) => void;
  onGuide?: (data: any) => void;
  onProducts?: (data: any) => void;
  onError?: (error: string) => void;
  chunkInterval?: number;
}

export const WebSocketAudioRecorder = ({
  onTranscription,
  onInformation,
  onInterest,
  onGuide,
  onProducts,
  onError,
  chunkInterval = 2000
}: WebSocketAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.CONNECTING || websocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data);
        
        switch (result.type) {
          case 'transcription':
            onTranscription?.(result.data);
            break;
          case 'information':
            onInformation?.(result.data);
            break;
          case 'interest':
            onInterest?.(result.data);
            break;
          case 'guide':
            onGuide?.(result.data);
            break;
          case 'products':
            onProducts?.(result.data);
            break;
        }
      } catch (error) {
        console.error('Message parse error:', error);
      }
    };
    
    ws.onclose = (event) => {
      setIsConnected(false);
      console.log('WebSocket closed:', event.code);
      if (event.code !== 1000) {
        setTimeout(() => {
          if (!websocketRef.current || websocketRef.current.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.('WebSocket connection error');
    };
    
    websocketRef.current = ws;
  }, [onTranscription, onInformation, onInterest, onGuide, onProducts, onError]);

  const sendCommand = useCallback((type: string, data: any) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 44100, channelCount: 1 }
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
          websocketRef.current.send(blob);
          chunksRef.current = [];
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      intervalRef.current = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setTimeout(() => {
            if (mediaRecorder.state === 'inactive') {
              mediaRecorder.start();
            }
          }, 100);
        }
      }, chunkInterval);
      
      setIsRecording(true);
    } catch (error) {
      onError?.('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  };

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      stopRecording();
      if (websocketRef.current) {
        websocketRef.current.close(1000, 'Component unmounting');
        websocketRef.current = null;
      }
    };
  }, []);

  return {
    isRecording,
    isConnected,
    startRecording,
    stopRecording,
    sendCommand,
    component: (
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isConnected}
          variant={isRecording ? 'destructive' : 'default'}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-500">Recording...</span>
          </div>
        )}
      </div>
    )
  };
};