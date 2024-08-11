import { useState, useEffect } from 'react';

function TextToSpeech() {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    const simulatedTextFromServer = '이것은 임의의 텍스트입니다.';

    const fetchText = () => {
      setText(simulatedTextFromServer);
      speak(simulatedTextFromServer);
    };

    fetchText();
    // const fetchTextFromServer = async () => {
    //   try {
    //     const baseUrl = import.meta.env.BASE_URL;
    //     const response = await fetch(`${baseUrl}/000`);
    //     const data = await response.text();
    //     setText(data);
    //     speak(data);
    //   } catch (error) {
    //     console.error('Error fetching text:', error);
    //   }
    // };

    // fetchTextFromServer();
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('에러');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Text to Speech</h1>
      <p>{text}</p>
    </div>
  );
}

export default TextToSpeech;
