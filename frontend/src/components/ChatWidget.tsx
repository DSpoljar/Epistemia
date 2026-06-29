import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const CHAT_URL =
  'https://ai-software-egnineering.app.n8n.cloud/webhook-test/7b9c4df9-b2ff-4857-a676-3719b4012c12';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const location = useLocation();

  const projectIdMatch = location.pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;

  async function send() {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          projectId,
          currentView: location.pathname,
        }),
      });
      setMessage('');
      setOpen(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72 flex flex-col gap-3">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Ask a question…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
            >
              Cancel
            </button>
            <button
              onClick={send}
              disabled={!message.trim() || sending}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        title="Help / Chat"
        aria-label="Open chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    </div>
  );
}
