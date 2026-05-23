import { useState, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useVoice = ({ canvasElements, setCanvasElements, history, document, currentPage, currentFont, currentFontSize, currentColor, language }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const voiceTextRef = useRef('');
  const voiceCharIndexRef = useRef(0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [ttsAudio, setTtsAudio] = useState(null);
  const audioRef = useRef(null);
  const [showVoice, setShowVoice] = useState(false);

  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);
  const [isRecordingEL, setIsRecordingEL] = useState(false);
  const [elSttLoading, setElSttLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const getDocText = () => {
    let allText = [];
    const cleanRedacted = (text) => {
      if (!text) return '';
      return text.replace(/<span[^>]*data-redacted="true"[^>]*>.*?<\/span>/gi, '[SANSÜRLÜ]')
                 .replace(/<[^>]*>/g, '').trim();
    };
    if (document?.pages) {
      document.pages.forEach((page, idx) => {
        const elements = idx === currentPage ? canvasElements : (page.elements || []);
        elements.forEach(el => {
          if (el.type === 'text' && !el.isRedacted) {
            const clean = el.htmlContent ? cleanRedacted(el.htmlContent) : (el.content || '');
            if (clean) allText.push(clean);
          }
        });
      });
    } else {
      canvasElements.filter(el => el.type === 'text' && !el.isRedacted).sort((a, b) => a.y - b.y).forEach(el => {
        const clean = el.htmlContent ? cleanRedacted(el.htmlContent) : (el.content || '');
        if (clean) allText.push(clean);
      });
    }
    return allText.join('. ');
  };

  const fetchVoices = async () => {
    try {
      const res = await axios.get(`${API}/voice/list`, { withCredentials: true });
      setAvailableVoices(res.data.voices || []);
    } catch (err) {
      console.error('Failed to fetch voices:', err);
    }
  };

  const playVoiceFromBrowser = (startFraction = 0) => {
    window.speechSynthesis.cancel();
    const fullText = getDocText(); if (!fullText) return;
    voiceTextRef.current = fullText;
    const startIndex = Math.floor(startFraction * fullText.length);
    const utterance = new SpeechSynthesisUtterance(fullText.substring(startIndex));
    voiceCharIndexRef.current = startIndex;
    utterance.onboundary = (ev) => { voiceCharIndexRef.current = startIndex + ev.charIndex; setVoiceProgress(((startIndex + ev.charIndex) / fullText.length) * 100); };
    utterance.onend = () => { setIsPlaying(false); setVoiceProgress(100); };
    setIsPlaying(true); window.speechSynthesis.speak(utterance);
  };

  const generateTTS = async () => {
    const text = getDocText();
    if (!text) return;
    setVoiceLoading(true);
    try {
      const res = await axios.post(`${API}/voice/tts`, {
        text: text,
        voice_id: selectedVoice,
        model_id: 'eleven_multilingual_v2'
      }, { withCredentials: true });
      setTtsAudio(res.data.audio_url);
      if (audioRef.current) {
        audioRef.current.src = res.data.audio_url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('TTS generation failed:', err);
      playVoiceFromBrowser();
    }
    setVoiceLoading(false);
  };

  const playVoiceFrom = (startFraction = 0) => {
    if (ttsAudio && audioRef.current) {
      audioRef.current.currentTime = audioRef.current.duration * startFraction;
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      playVoiceFromBrowser(startFraction);
    }
  };

  const skipVoice = (dir) => {
    if (ttsAudio && audioRef.current) {
      const skip = audioRef.current.duration * 0.1;
      audioRef.current.currentTime = dir === 'back'
        ? Math.max(0, audioRef.current.currentTime - skip)
        : Math.min(audioRef.current.duration, audioRef.current.currentTime + skip);
    } else {
      const fullText = voiceTextRef.current || getDocText(); if (!fullText) return;
      const skip = Math.floor(fullText.length * 0.1);
      const newIndex = dir === 'back' ? Math.max(0, voiceCharIndexRef.current - skip) : Math.min(fullText.length, voiceCharIndexRef.current + skip);
      playVoiceFromBrowser(newIndex / fullText.length);
    }
  };

  const stopVoice = () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setVoiceProgress(0);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support Speech Recognition. Please use Chrome.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language === 'tr' ? 'tr-TR' : 'en-US';
    recognitionRef.current.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);
    };
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const startElevenLabsSTT = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Mikrofon erişimi bu tarayıcıda desteklenmiyor.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setElSttLoading(true);
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          formData.append('language', language === 'tr' ? 'tr' : 'en');
          const res = await axios.post(`${API}/voice/stt`, formData, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
          if (res.data.transcript) {
            setVoiceTranscript(prev => prev ? prev + ' ' + res.data.transcript : res.data.transcript);
          }
        } catch (err) {
          alert('ElevenLabs STT hatası: ' + (err.response?.data?.detail || err.message));
        } finally {
          setElSttLoading(false);
        }
      };
      recorder.start();
      setIsRecordingEL(true);
    } catch (err) {
      alert('Mikrofon erişimi reddedildi: ' + err.message);
    }
  };

  const stopElevenLabsSTT = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingEL(false);
  };

  const addVoiceTextToDocument = () => {
    if (!voiceTranscript.trim()) return;
    const newEl = {
      id: `el_${Date.now()}`,
      type: 'text',
      x: 40,
      y: 40 + canvasElements.filter(e => e.type === 'text').length * 30,
      content: voiceTranscript,
      font: currentFont,
      fontSize: currentFontSize,
      color: currentColor,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      textAlign: 'left',
      lineHeight: 1.5,
    };
    const updated = [...canvasElements, newEl];
    setCanvasElements(updated);
    history.push(updated);
    setVoiceTranscript('');
    setShowVoiceInput(false);
  };

  return {
    isPlaying, setIsPlaying,
    voiceProgress, setVoiceProgress,
    audioRef,
    availableVoices, selectedVoice, setSelectedVoice,
    voiceLoading, ttsAudio, setTtsAudio,
    showVoice, setShowVoice,
    showVoiceInput, setShowVoiceInput,
    isListening, voiceTranscript, setVoiceTranscript,
    isRecordingEL, elSttLoading,
    generateTTS, fetchVoices, playVoiceFrom, skipVoice, stopVoice,
    startListening, stopListening, startElevenLabsSTT, stopElevenLabsSTT,
    addVoiceTextToDocument,
  };
};
