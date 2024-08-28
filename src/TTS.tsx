import React, { useRef } from 'react';

interface TTSAudioPlayerProps {
  audioUrl: string;
  onEnded?: () => void;
}

export const TTSAudioPlayer: React.FC<TTSAudioPlayerProps> = ({
  audioUrl,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  }, [audioUrl]);

  return <audio ref={audioRef} onEnded={onEnded} />;
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
