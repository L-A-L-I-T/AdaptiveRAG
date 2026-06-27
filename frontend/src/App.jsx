import { useEffect, useRef, useState } from "react";
import { resetSession, sendQuery, uploadDocument } from "./api.js";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [uploadedKeys, setUploadedKeys] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const answer = await sendQuery(query);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!file || !description.trim() || uploading) return;

    const uploadKey = `${file.name}_${description.trim()}`;
    if (uploadedKeys.includes(uploadKey)) {
      setUploadStatus(`Already uploaded: ${file.name}`);
      return;
    }

    setUploading(true);
    setUploadStatus("Uploading...");

    try {
      const success = await uploadDocument(file, description.trim());
      if (success) {
        setUploadedKeys((prev) => [...prev, uploadKey]);
        setUploadStatus(`Uploaded: ${file.name}`);
        setFile(null);
        setDescription("");
      } else {
        setUploadStatus("Upload failed. Please try again.");
      }
    } catch (error) {
      setUploadStatus(`Upload error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  function handleNewSession() {
    resetSession();
    setMessages([]);
    setUploadedKeys([]);
    setUploadStatus("");
    setFile(null);
    setDescription("");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Adaptive RAG</h1>
          <p>Upload documents, then ask questions about them.</p>
        </div>

        <form className="upload-form" onSubmit={handleUpload}>
          <h2>Upload document</h2>
          <label className="field">
            <span>File (PDF or TXT)</span>
            <input
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="E.g. My resume with work experience and skills"
              rows={4}
              maxLength={300}
            />
          </label>
          <button type="submit" disabled={!file || !description.trim() || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
          {uploadStatus && <p className="status">{uploadStatus}</p>}
        </form>

        <button type="button" className="secondary" onClick={handleNewSession}>
          New session
        </button>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <h2>Chat</h2>
        </header>

        <div className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>Upload a document, then ask a question about it.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <span className="role">{message.role === "user" ? "You" : "Assistant"}</span>
              <p>{message.content}</p>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <span className="role">Assistant</span>
              <p className="typing">Thinking...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
          />
          <button type="submit" disabled={!input.trim() || loading}>
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
