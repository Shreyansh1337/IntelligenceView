
import { useState, useRef, useEffect } from "react";
import { House, Mic, MicOff } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Ring from "../components/Ring.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const API_URL =
  import.meta.env.VITE_API_URL || "https://intelligenceview.onrender.com";

const WS_URL = API_URL.replace(/^https:/, "wss:").replace(/^http:/, "ws:");

function downsampleTo16k(float32Buffer, inputSampleRate) {
  if (inputSampleRate < 16000) {
    throw new Error("Your audio sample rate is too low for the interview.");
  }

  if (inputSampleRate === 16000) {
    return float32ToInt16(float32Buffer);
  }

  const ratio = inputSampleRate / 16000;
  const outputLength = Math.floor(float32Buffer.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), float32Buffer.length);

    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += float32Buffer[j];
    }

    output[i] = sum / Math.max(1, end - start);
  }

  return float32ToInt16(output);
}

function float32ToInt16(float32Buffer) {
  const int16Buffer = new Int16Array(float32Buffer.length);

  for (let i = 0; i < float32Buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Buffer[i]));
    int16Buffer[i] = sample < 0 ? sample * 32768 : sample * 32767;
  }

  return int16Buffer;
}

function Interview() {
  const { isDarkMode } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId;

  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState("");
  const [isAudioStarting, setIsAudioStarting] = useState(false);
  const [isAudioConnected, setIsAudioConnected] = useState(false);

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const silentGainRef = useRef(null);
  const nextPlaybackTimeRef = useRef(0);
  const playbackSourcesRef = useRef(new Set());
  const isUnmountedRef = useRef(false);
  const isStoppingRef = useRef(false);
  const audioStartingRef = useRef(false);

  const cleanupAudio = async () => {
    const ws = wsRef.current;
    wsRef.current = null;

    if (ws && ws.readyState < WebSocket.CLOSING) {
      ws.close(1000, "Audio session closed");
    }

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }

    if (silentGainRef.current) {
      try {
        silentGainRef.current.disconnect();
      } catch {}
      silentGainRef.current = null;
    }

    playbackSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {}
      try {
        source.disconnect();
      } catch {}
    });

    playbackSourcesRef.current.clear();

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      const context = audioContextRef.current;
      audioContextRef.current = null;

      try {
        await context.close();
      } catch {}
    }

    nextPlaybackTimeRef.current = 0;

    if (!isUnmountedRef.current) {
      setIsAudioConnected(false);
      setIsAudioStarting(false);
    }

    audioStartingRef.current = false;
  };

  useEffect(() => {
    isUnmountedRef.current = false;

    return () => {
      isUnmountedRef.current = true;

      const ws = wsRef.current;
      wsRef.current = null;

      if (ws && ws.readyState < WebSocket.CLOSING) {
        ws.close(1000, "Interview page closed");
      }

      if (processorRef.current) {
        processorRef.current.onaudioprocess = null;
        try {
          processorRef.current.disconnect();
        } catch {}
      }

      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {}
      }

      if (silentGainRef.current) {
        try {
          silentGainRef.current.disconnect();
        } catch {}
      }

      playbackSourcesRef.current.forEach((source) => {
        try {
          source.stop();
        } catch {}
        try {
          source.disconnect();
        } catch {}
      });

      playbackSourcesRef.current.clear();

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      audioStartingRef.current = false;
    };
  }, []);

  // Check whether the backend has finished the interview.
  useEffect(() => {
    if (!interviewId) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      logout();
      return;
    }

    let isMounted = true;
    let isRedirecting = false;

    const checkInterviewStatus = async () => {
      if (isRedirecting) return;

      try {
        const response = await fetch(
          `${API_URL}/interview/status/${interviewId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 401) {
          if (isMounted) logout();
          return;
        }

        if (!response.ok) return;

        const data = await response.json();

        if (data.completed && isMounted && !isRedirecting) {
          isRedirecting = true;
          await cleanupAudio();
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("Error checking interview status:", err);
      }
    };

    checkInterviewStatus();

    const intervalId = setInterval(checkInterviewStatus, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [interviewId, logout, navigate]);

  const handleStartAudio = async () => {
    if (
      audioStartingRef.current ||
      isAudioConnected ||
      isStoppingRef.current
    ) {
      return;
    }

    if (!interviewId) {
      setError("Interview ID is missing. Please start the interview again.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      logout();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Microphone access is unavailable. Open the site in a supported browser using HTTPS."
      );
      return;
    }

    audioStartingRef.current = true;
    setIsAudioStarting(true);
    setError("");

    let ws;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (isUnmountedRef.current || isStoppingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        audioStartingRef.current = false;
        return;
      }

      micStreamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("Your browser does not support Web Audio.");
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      await audioContext.resume();

      const microphoneSource = audioContext.createMediaStreamSource(stream);
      sourceRef.current = microphoneSource;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      silentGainRef.current = silentGain;

      microphoneSource.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);

      const audioWsUrl =
        `${WS_URL}/interview/ws/${interviewId}` +
        `?token=${encodeURIComponent(token)}`;

      ws = new WebSocket(audioWsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      await new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          reject(new Error("Timed out connecting to interview audio."));
        }, 30000);

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          resolve();
        };

        ws.onerror = () => {
          clearTimeout(connectionTimeout);
          reject(
            new Error("Could not connect to the interview audio server.")
          );
        };

        ws.onclose = (event) => {
          clearTimeout(connectionTimeout);

          if (wsRef.current === ws) {
            wsRef.current = null;

            if (!isUnmountedRef.current) {
              void cleanupAudio();

              if (!isStoppingRef.current) {
                setIsAudioConnected(false);

                if (event.code !== 1000) {
                  setError(
                    event.reason ||
                      "Audio connection closed. Check the backend logs and try again."
                  );
                }
              }
            }
          }
        };
      });

      if (isUnmountedRef.current || isStoppingRef.current) {
        await cleanupAudio();
        return;
      }

      ws.onmessage = async (event) => {
        if (typeof event.data === "string") {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "audio_end") {
              if (message.final === true) {
                const context = audioContextRef.current;

                if (context && context.state !== "closed") {
                  const remainingTime = Math.max(
                    0,
                    nextPlaybackTimeRef.current - context.currentTime
                  );

                  // Wait until all scheduled Gemini audio has played.
                  await new Promise((resolve) => {
                    setTimeout(resolve, remainingTime * 1000 + 150);
                  });
                }

                const currentWs = wsRef.current;

                if (
                  currentWs &&
                  currentWs.readyState === WebSocket.OPEN
                ) {
                  currentWs.send(
                    JSON.stringify({ type: "playback_finished" })
                  );
                }
              }

              return;
            }

            if (message.type === "error") {
              setError(
                message.message || "The audio server reported an error."
              );
            }
          } catch {
            console.warn("Received an unrecognized audio server message.");
          }

          return;
        }

        try {
          const context = audioContextRef.current;

          if (!context || context.state === "closed") return;

          let arrayBuffer;

          if (event.data instanceof ArrayBuffer) {
            arrayBuffer = event.data;
          } else if (event.data instanceof Blob) {
            arrayBuffer = await event.data.arrayBuffer();
          } else {
            return;
          }

          if (arrayBuffer.byteLength < 2) return;

          // Gemini Live audio output: 24 kHz mono signed 16-bit PCM.
          const pcm = new Int16Array(
            arrayBuffer,
            0,
            Math.floor(arrayBuffer.byteLength / 2)
          );

          const audioBuffer = context.createBuffer(1, pcm.length, 24000);
          const channel = audioBuffer.getChannelData(0);

          for (let i = 0; i < pcm.length; i++) {
            channel[i] = pcm[i] / 32768;
          }

          const source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(context.destination);

          const now = context.currentTime;
          const startAt = Math.max(
            now + 0.02,
            nextPlaybackTimeRef.current
          );

          source.start(startAt);
          nextPlaybackTimeRef.current = startAt + audioBuffer.duration;
          playbackSourcesRef.current.add(source);

          source.onended = () => {
            playbackSourcesRef.current.delete(source);

            try {
              source.disconnect();
            } catch {}
          };
        } catch (err) {
          console.error("Error playing Gemini audio:", err);
          setError("Could not play the interviewer's audio.");
        }
      };

      processor.onaudioprocess = (event) => {
        const currentWs = wsRef.current;

        if (
          !currentWs ||
          currentWs.readyState !== WebSocket.OPEN ||
          isStoppingRef.current
        ) {
          return;
        }

        try {
          const input = event.inputBuffer.getChannelData(0);
          const pcm16 = downsampleTo16k(input, audioContext.sampleRate);
          currentWs.send(pcm16.buffer);
        } catch (err) {
          console.error("Microphone audio processing error:", err);
          setError("Could not process microphone audio.");
        }
      };

      setIsAudioConnected(true);
      setIsAudioStarting(false);
      audioStartingRef.current = false;
    } catch (err) {
      console.error("Error starting interview audio:", err);

      if (!isUnmountedRef.current) {
        setError(
          err.message ||
            "Could not start audio. Check microphone permissions and the backend connection."
        );
      }

      await cleanupAudio();
    }
  };

  const handleStopInterview = async () => {
    if (isStoppingRef.current) return;

    if (!interviewId) {
      setError("Interview ID is missing. Cannot stop the interview.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      logout();
      return;
    }

    isStoppingRef.current = true;
    setIsStopping(true);
    setError("");

    try {
      await cleanupAudio();

      const response = await fetch(
        `${API_URL}/interview/end/${interviewId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        logout();
        return;
      }

      // The interview may already have ended automatically.
      if (response.status === 404) {
        const statusResponse = await fetch(
          `${API_URL}/interview/status/${interviewId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (statusResponse.status === 401) {
          logout();
          return;
        }

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();

          if (statusData.completed) {
            navigate("/", { replace: true });
            return;
          }
        }

        throw new Error(data.detail || "The interview could not be stopped.");
      }

      if (!response.ok) {
        throw new Error(data.detail || "Failed to stop the interview.");
      }

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Error stopping interview:", err);
      setError(
        err.message || "Could not contact the backend. Please try again."
      );
    } finally {
      isStoppingRef.current = false;
      setIsStopping(false);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkMode ? "bg-zinc-950" : "bg-zinc-50"
      }`}
    >
      {/* Navbar */}
      <nav
        className={`h-14 border-b px-4 sm:px-6 md:px-8 flex items-center transition-colors ${
          isDarkMode
            ? "border-zinc-800 bg-zinc-900"
            : "border-zinc-200 bg-white"
        }`}
      >
        <h1
          className={`text-base sm:text-lg md:text-xl font-bold ${
            isDarkMode ? "text-white" : "text-zinc-900"
          }`}
        >
          Intelligence<span className="text-orange-500">View</span>
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/"
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "text-zinc-300 hover:bg-zinc-800"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
            aria-label="Home"
          >
            <House size={20} />
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Interview Content */}
      <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8">
        <div
          className={`relative flex h-80 w-80 max-w-full items-center justify-center rounded-full border sm:h-96 sm:w-96 md:h-105 md:w-105 ${
            isDarkMode
              ? "border-zinc-700 bg-zinc-900"
              : "border-zinc-300 bg-white"
          }`}
        >
          <Ring />

          <p
            className={`absolute inset-0 z-10 flex items-center justify-center text-center text-sm font-medium ${
              isDarkMode ? "text-zinc-200" : "text-zinc-800"
            }`}
          >
            {isStopping
              ? "Stopping interview..."
              : isAudioStarting
                ? "Connecting audio..."
                : isAudioConnected
                  ? "Interview in progress — listening"
                  : "Interview ready — start audio"}
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 max-w-md text-center text-sm text-red-500"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleStartAudio}
          disabled={isStopping || isAudioStarting || isAudioConnected}
          className={`mt-5 sm:mt-6 flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isDarkMode
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-orange-600 text-white hover:bg-orange-700"
          }`}
        >
          {isAudioConnected ? <Mic size={18} /> : <MicOff size={18} />}
          {isAudioStarting
            ? "Connecting Audio..."
            : isAudioConnected
              ? "Microphone Connected"
              : "Start Interview Audio"}
        </button>

        <button
          type="button"
          onClick={handleStopInterview}
          disabled={isStopping}
          className="mt-3 w-auto rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isStopping ? "Stopping Interview..." : "Stop Interview"}
        </button>
      </main>
    </div>
  );
}

export default Interview;
