import { useState, useRef, useEffect } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { type: "user", text: input }];
    setMessages(newMessages);
    setLoading(true);

    const res = await fetch("https://ai-chatbot-project-1-zyuv.onrender.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        messages: newMessages,
      })
    });

    const data = await res.json();

    setMessages([...newMessages, { type: "bot", text: data.reply }]);
    setInput("");
    setLoading(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">

      {/* Header */}
      <div className="p-4 text-xl font-semibold backdrop-blur bg-white/5 border-b border-white/10">
        🤖 AI Assistant
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-md px-4 py-3 rounded-2xl shadow ${msg.type === "user"
                ? "bg-blue-500 ml-auto"
                : "bg-white/10 backdrop-blur"
              }`}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="bg-white/10 px-4 py-2 rounded-xl w-fit animate-pulse">
            Typing...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 flex gap-2 border-t border-white/10 bg-black/40 backdrop-blur">
        <input
          className="flex-1 p-3 rounded-xl bg-white/10 outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
        />

        <button
          onClick={sendMessage}
          className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}