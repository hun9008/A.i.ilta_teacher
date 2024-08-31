import React, { useRef, useState, useEffect } from 'react';

interface TTSAudioPlayerProps {
  ttsQueue: string[];
  onTTSComplete: () => void;
}

export const TTSAudioPlayer: React.FC<TTSAudioPlayerProps> = ({
  ttsQueue,
  onTTSComplete,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (ttsQueue.length > 0 && !currentAudioUrl) {
      const nextAudioUrl = ttsQueue[0];
      setCurrentAudioUrl(nextAudioUrl);
    }
  }, [ttsQueue, currentAudioUrl]);

  useEffect(() => {
    if (currentAudioUrl && audioRef.current) {
      audioRef.current.src = currentAudioUrl;
      audioRef.current.play();
    }
  }, [currentAudioUrl]);

  const handleAudioEnd = () => {
    onTTSComplete();
    setCurrentAudioUrl(null); // Prepare for the next audio in the queue
  };

  return <audio ref={audioRef} onEnded={handleAudioEnd} />;
};

export const handleTTS = async (
  text: string,
  u_id: string
): Promise<string | null> => {
  try {
    const endpoint = `${import.meta.env.VITE_BASE_URL}/tts/chat`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        u_id: u_id,
        text: text,
        voice: 'shimmer',
      }),
    });

    if (!response.ok) {
      console.error('TTS API request failed:', response.statusText);
      return null;
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);

    return audioUrl;
  } catch (error) {
    console.error('Error in handleTTS:', error);
    return null;
  }
};
