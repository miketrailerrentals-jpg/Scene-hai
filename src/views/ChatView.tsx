import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';

export const ChatView: React.FC<{ sceneId: string }> = ({ sceneId }) => {
  const {
    allScenes,
    store,
    updateStore,
    currentUser,
    openAuthPrompt,
    navigate,
    getActiveDisplayName
  } = useApp();

  const [inputText, setInputText] = useState('');
  const scene = allScenes.find(s => s.id === sceneId);

  if (!scene) {
    return (
      <div className="view empty-state">
        <h1>Scene not found</h1>
        <p>It might have been removed.</p>
        <button
          type="button"
          className="button dark"
          onClick={() => navigate('discover')}
        >
          Back home <Icon name="arrow" size={17} />
        </button>
      </div>
    );
  }

  const isJoined = store.joined.includes(scene.id);
  const isHosting = !!scene.isMine;

  if (!isJoined && !isHosting) {
    return (
      <div className="view">
        <div className="page-title-top">
          <h1>Approval first</h1>
          <p>Only approved participants can access scene chat.</p>
        </div>
        <button
          type="button"
          className="button dark"
          onClick={() => navigate(`scene/${scene.id}`)}
        >
          Back to scene
        </button>
      </div>
    );
  }

  const messages = store.messages[scene.id] || [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if (!currentUser) {
      openAuthPrompt('Sign in with Google to send messages in the group chat', {
        type: 'chat',
        sceneId: scene.id,
        text
      });
      return;
    }

    const timeStr = new Date().toLocaleTimeString('en-PK', {
      hour: 'numeric',
      minute: '2-digit'
    });

    updateStore(s => ({
      ...s,
      messages: {
        ...s.messages,
        [scene.id]: [
          ...(s.messages[scene.id] || []),
          {
            from: 'me',
            name: getActiveDisplayName(),
            text,
            time: timeStr
          }
        ]
      }
    }));

    setInputText('');
  };

  return (
    <div className="view chat-view">
      <div className="chat-header">
        <button
          type="button"
          className="round-control"
          onClick={() => navigate(`scene/${scene.id}`)}
          aria-label="Back to scene"
        >
          <Icon name="back" size={19} />
        </button>
        <div className="chat-scene-icon">
          <img src={`/assets/${scene.image}.svg`} alt="" loading="lazy" />
        </div>
        <div>
          <strong>{scene.title}</strong>
          <span>Demo group chat · {scene.going} participants</span>
        </div>
      </div>

      <div className="chat-messages">
        <div className="chat-day">TODAY</div>
        {messages.map((m, idx) => {
          const isMine = m.from === 'me';
          return (
            <div key={idx} className={`bubble ${isMine ? 'mine' : ''}`}>
              {!isMine && <small>{m.name}</small>}
              <p>{m.text}</p>
              <time>{m.time}</time>
            </div>
          );
        })}
        {!messages.length && (
          <div className="chat-first">No messages yet. Say hello 👋</div>
        )}
      </div>

      <form id="chat-form" className="chat-compose" onSubmit={handleSendMessage}>
        <input
          name="message"
          maxLength={400}
          aria-label="Message"
          placeholder="Type a message..."
          autoComplete="off"
          required
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button type="submit" aria-label="Send message">
          <Icon name="send" size={20} />
        </button>
      </form>

      <div className="chat-disclaimer">
        Offline demo — messages stay on this device.
      </div>
    </div>
  );
};
