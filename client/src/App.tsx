import { useEffect, useRef, useState } from "react";

type SpeechRecognitionEventLike = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

type Message = {
  sender: "AI" | "You";
  text: string;
};

const questions = [
  "Hello! I'm your AI health screening assistant. What is your main health concern today?",
  "How long have you been experiencing this problem?",
  "How would you describe the severity of your symptoms?",
  "Have you noticed any other symptoms along with this problem?",
  "Have you taken any medicine or treatment for this?",
  "Do you have any existing medical conditions or allergies?",
];

function App() {
  const [started, setStarted] = useState(false);
  const [listening, setListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [finished, setFinished] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    setListening(true);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const startScreening = () => {
    setStarted(true);
    setFinished(false);
    setShowReport(false);
    setCurrentQuestion(0);

    const firstMessage = questions[0];

    setMessages([
      {
        sender: "AI",
        text: firstMessage,
      },
    ]);

    setTimeout(() => {
      speak(firstMessage);
    }, 300);
  };

  const sendAnswer = () => {
    const answer = input.trim();

    if (!answer) return;

    const newMessages: Message[] = [
      ...messages,
      {
        sender: "You",
        text: answer,
      },
    ];

    setMessages(newMessages);
    setInput("");

    const nextQuestion = currentQuestion + 1;

    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);

      const aiQuestion = questions[nextQuestion];

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: aiQuestion,
          },
        ]);

        speak(aiQuestion);
      }, 500);
    } else {
      setFinished(true);

      const finalMessage =
        "Thank you. I have collected the information needed for your initial screening. You can now view your screening report.";

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: finalMessage,
          },
        ]);

        speak(finalMessage);
      }, 500);
    }
  };

  const endCall = () => {
    stopListening();
    window.speechSynthesis?.cancel();

    setStarted(false);
    setFinished(true);
    setShowReport(true);
  };

  const generateReport = () => {
    setShowReport(true);
  };

  const resetApp = () => {
    stopListening();
    window.speechSynthesis?.cancel();

    setStarted(false);
    setFinished(false);
    setShowReport(false);
    setCurrentQuestion(0);
    setMessages([]);
    setInput("");
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, Arial, sans-serif;
          background: #f4f7fb;
          color: #172033;
        }

        button {
          font-family: inherit;
        }

        .app {
          min-height: 100vh;
        }

        .navbar {
          height: 72px;
          background: white;
          border-bottom: 1px solid #e5eaf2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 7%;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 21px;
          font-weight: 800;
          color: #176bff;
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #176bff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #667085;
        }

        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #22c55e;
        }

        .hero {
          max-width: 1100px;
          margin: 0 auto;
          padding: 55px 20px;
        }

        .welcome {
          text-align: center;
          margin-bottom: 35px;
        }

        .welcome h1 {
          margin: 0 0 12px;
          font-size: 42px;
          line-height: 1.15;
        }

        .welcome p {
          margin: 0 auto;
          max-width: 650px;
          color: #667085;
          font-size: 17px;
          line-height: 1.6;
        }

        .main-card {
          background: white;
          border: 1px solid #e5eaf2;
          border-radius: 24px;
          box-shadow: 0 15px 45px rgba(31, 48, 74, 0.08);
          overflow: hidden;
        }

        .start-screen {
          padding: 55px 35px;
          text-align: center;
        }

        .health-icon {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #eaf2ff;
          color: #176bff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 25px;
          font-size: 42px;
        }

        .start-screen h2 {
          font-size: 28px;
          margin: 0 0 12px;
        }

        .start-screen p {
          color: #667085;
          max-width: 600px;
          margin: 0 auto 30px;
          line-height: 1.6;
        }

        .primary-btn {
          border: none;
          background: #176bff;
          color: white;
          padding: 15px 30px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .primary-btn:hover {
          background: #0758df;
          transform: translateY(-1px);
        }

        .call-header {
          padding: 22px 28px;
          border-bottom: 1px solid #e5eaf2;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .call-title {
          font-weight: 750;
          font-size: 18px;
        }

        .call-status {
          color: #16a34a;
          font-size: 13px;
          font-weight: 600;
        }

        .conversation {
          height: 430px;
          overflow-y: auto;
          padding: 28px;
          background: #fbfcfe;
        }

        .message {
          display: flex;
          margin-bottom: 18px;
        }

        .message.ai {
          justify-content: flex-start;
        }

        .message.you {
          justify-content: flex-end;
        }

        .bubble {
          max-width: 75%;
          padding: 14px 17px;
          border-radius: 16px;
          line-height: 1.5;
          font-size: 15px;
        }

        .ai .bubble {
          background: #edf4ff;
          color: #183153;
          border-bottom-left-radius: 4px;
        }

        .you .bubble {
          background: #176bff;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .composer {
          padding: 20px 25px;
          border-top: 1px solid #e5eaf2;
        }

        .input-row {
          display: flex;
          gap: 10px;
        }

        .text-input {
          flex: 1;
          min-width: 0;
          border: 1px solid #d8dee9;
          border-radius: 12px;
          padding: 14px;
          font-size: 15px;
          outline: none;
        }

        .text-input:focus {
          border-color: #176bff;
        }

        .mic-btn {
          width: 50px;
          border: none;
          border-radius: 12px;
          background: #eef2f7;
          color: #344054;
          cursor: pointer;
          font-size: 20px;
        }

        .mic-btn.active {
          background: #fee2e2;
          color: #dc2626;
          animation: pulse 1.3s infinite;
        }

        @keyframes pulse {
          50% {
            transform: scale(1.06);
          }
        }

        .send-btn {
          border: none;
          padding: 0 22px;
          border-radius: 12px;
          background: #176bff;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          gap: 10px;
        }

        .secondary-btn,
        .danger-btn {
          padding: 11px 18px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 650;
        }

        .secondary-btn {
          border: 1px solid #d8dee9;
          background: white;
          color: #344054;
        }

        .danger-btn {
          border: 1px solid #fecaca;
          background: #fff5f5;
          color: #dc2626;
        }

        .report {
          padding: 35px;
        }

        .report-title {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
        }

        .report-title-icon {
          width: 55px;
          height: 55px;
          border-radius: 15px;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
        }

        .report h2 {
          margin: 0;
          font-size: 27px;
        }

        .report-subtitle {
          margin: 5px 0 0;
          color: #667085;
        }

        .report-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .report-box {
          border: 1px solid #e5eaf2;
          border-radius: 15px;
          padding: 20px;
          background: #fff;
        }

        .report-box h3 {
          margin: 0 0 9px;
          font-size: 15px;
          color: #667085;
        }

        .report-box p {
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
        }

        .notice {
          margin-top: 20px;
          background: #fff8e6;
          border: 1px solid #fde68a;
          padding: 16px;
          border-radius: 12px;
          color: #854d0e;
          font-size: 14px;
          line-height: 1.5;
        }

        .report-actions {
          margin-top: 25px;
          display: flex;
          gap: 12px;
        }

        @media (max-width: 700px) {
          .navbar {
            padding: 0 18px;
          }

          .welcome h1 {
            font-size: 32px;
          }

          .hero {
            padding: 35px 12px;
          }

          .start-screen {
            padding: 40px 20px;
          }

          .conversation {
            height: 420px;
            padding: 18px;
          }

          .bubble {
            max-width: 88%;
          }

          .input-row {
            flex-wrap: wrap;
          }

          .text-input {
            width: 100%;
            flex-basis: 100%;
          }

          .send-btn {
            height: 50px;
            flex: 1;
          }

          .mic-btn {
            height: 50px;
          }

          .report-grid {
            grid-template-columns: 1fr;
          }

          .report {
            padding: 22px;
          }
        }
      `}</style>

      <div className="app">
        <nav className="navbar">
          <div className="logo">
            <div className="logo-icon">♥</div>
            HealthScreen AI
          </div>

          <div className="status">
            <span className="status-dot"></span>
            AI Assistant Online
          </div>
        </nav>

        <main className="hero">
          <div className="welcome">
            <h1>AI Health Screening</h1>
            <p>
              Have a simple conversation with our AI health assistant to
              understand your symptoms and receive an initial screening
              summary.
            </p>
          </div>

          <div className="main-card">
            {!started && !showReport && (
              <div className="start-screen">
                <div className="health-icon">✚</div>

                <h2>Start your health screening</h2>

                <p>
                  The AI assistant will ask you a few questions about your
                  symptoms. You can type your answers or use your microphone
                  to speak naturally.
                </p>

                <button className="primary-btn" onClick={startScreening}>
                  🎙 Start Screening
                </button>
              </div>
            )}

            {started && !showReport && (
              <>
                <div className="call-header">
                  <div className="call-title">AI Health Assistant</div>

                  <div className="call-status">
                    ● Screening in progress
                  </div>
                </div>

                <div className="conversation">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`message ${
                        message.sender === "AI" ? "ai" : "you"
                      }`}
                    >
                      <div className="bubble">{message.text}</div>
                    </div>
                  ))}

                  {listening && (
                    <div className="message ai">
                      <div className="bubble">
                        🎤 Listening... Please speak now.
                      </div>
                    </div>
                  )}
                </div>

                <div className="composer">
                  <div className="input-row">
                    <input
                      className="text-input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendAnswer();
                        }
                      }}
                      placeholder="Type your answer..."
                    />

                    <button
                      className={`mic-btn ${listening ? "active" : ""}`}
                      onClick={listening ? stopListening : startListening}
                      title="Use microphone"
                    >
                      {listening ? "⏹" : "🎤"}
                    </button>

                    <button className="send-btn" onClick={sendAnswer}>
                      Send
                    </button>
                  </div>

                  <div className="actions">
                    <button
                      className="secondary-btn"
                      onClick={() => speak(questions[currentQuestion])}
                    >
                      🔊 Repeat Question
                    </button>

                    <button className="danger-btn" onClick={endCall}>
                      End Call
                    </button>
                  </div>

                  {finished && (
                    <div style={{ marginTop: "15px", textAlign: "center" }}>
                      <button
                        className="primary-btn"
                        onClick={generateReport}
                      >
                        📋 View Screening Report
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {showReport && (
              <div className="report">
                <div className="report-title">
                  <div className="report-title-icon">✓</div>

                  <div>
                    <h2>Screening Report</h2>
                    <p className="report-subtitle">
                      Initial AI-assisted health screening summary
                    </p>
                  </div>
                </div>

                <div className="report-grid">
                  <div className="report-box">
                    <h3>Primary Concern</h3>
                    <p>
                      Based on the conversation, the patient's primary concern
                      was recorded for further evaluation.
                    </p>
                  </div>

                  <div className="report-box">
                    <h3>Symptoms</h3>
                    <p>
                      Symptoms and their duration were collected during the
                      screening conversation.
                    </p>
                  </div>

                  <div className="report-box">
                    <h3>Severity</h3>
                    <p>
                      Severity information was provided by the patient during
                      the screening.
                    </p>
                  </div>

                  <div className="report-box">
                    <h3>Recommendation</h3>
                    <p>
                      Consider consulting a qualified healthcare professional
                      for a proper medical evaluation.
                    </p>
                  </div>
                </div>

                <div className="notice">
                  ⚠️ <strong>Important:</strong> This screening is for
                  informational purposes only and does not provide a medical
                  diagnosis. If you have severe or emergency symptoms, seek
                  immediate medical care.
                </div>

                <div className="report-actions">
                  <button className="primary-btn" onClick={resetApp}>
                    Start New Screening
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default App;