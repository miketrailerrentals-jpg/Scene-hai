import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { db, handleFirestoreError } from '../firebase';
import { Icon } from '../icons';
import { Scene, SceneMessage } from '../types';
import { formatFirestoreScene } from '../utils';

export const ChatView: React.FC<{ sceneId: string }> = ({ sceneId }) => {
  const {
    allScenes,
    store,
    updateStore,
    currentUser,
    activeProfile,
    openAuthPrompt,
    navigate,
    showToast,
    getActiveDisplayName
  } = useApp();

  const [directScene, setDirectScene] = useState<Scene | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<SceneMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accessRevoked, setAccessRevoked] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Find scene in context or fetch directly if navigated directly
  const scene = useMemo(() => {
    return allScenes.find(s => s.id === sceneId) || directScene;
  }, [allScenes, sceneId, directScene]);

  useEffect(() => {
    if (!scene && db) {
      let isMounted = true;
      setSceneLoading(true);
      getDoc(doc(db, 'scenes', sceneId))
        .then(snap => {
          if (isMounted && snap.exists()) {
            setDirectScene(formatFirestoreScene(snap.id, snap.data(), currentUser?.uid));
          }
        })
        .catch(err => {
          handleFirestoreError(err, 'Fetch Chat Scene');
        })
        .finally(() => {
          if (isMounted) setSceneLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [scene, sceneId]);

  const isHost = Boolean(
    currentUser && scene && (scene.hostId === currentUser.uid || scene.isMine)
  );

  // 1. Verify membership lifecycle in real time
  useEffect(() => {
    if (!currentUser || !scene || !db || !scene.isFirestore) {
      setCheckingAuth(false);
      return;
    }

    if (isHost) {
      setMembershipStatus('approved');
      setCheckingAuth(false);
      setAccessRevoked(false);
      return;
    }

    // Listen to user's joinRequest on this scene
    const requestDocRef = doc(db, 'scenes', scene.id, 'joinRequests', currentUser.uid);
    const unsubRequest = onSnapshot(
      requestDocRef,
      snap => {
        setCheckingAuth(false);
        if (snap.exists()) {
          const reqData = snap.data();
          const status = reqData?.status;
          setMembershipStatus(status);
          if (status === 'approved') {
            setAccessRevoked(false);
          } else {
            setAccessRevoked(true);
          }
        } else {
          setMembershipStatus(null);
          setAccessRevoked(true);
        }
      },
      err => {
        handleFirestoreError(err, 'Check Chat Membership');
        setCheckingAuth(false);
        setAccessRevoked(true);
      }
    );

    return () => {
      unsubRequest();
    };
  }, [currentUser, scene?.id, scene?.hostId, scene?.isFirestore, isHost]);

  const isAuthorized = isHost || membershipStatus === 'approved';

  // 2. Real-time messages listener
  useEffect(() => {
    if (!scene || !scene.isFirestore || !db) {
      setMessagesLoading(false);
      return;
    }

    if (!currentUser || !isAuthorized || accessRevoked) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);
    const messagesCol = collection(db, 'scenes', scene.id, 'messages');
    const messagesQuery = query(messagesCol, orderBy('createdAt', 'asc'));

    const unsubMessages = onSnapshot(
      messagesQuery,
      snap => {
        const loaded: SceneMessage[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            senderId: data.senderId,
            senderDisplayName: data.senderDisplayName || 'Community Member',
            text: data.text,
            createdAt: data.createdAt
          };
        });
        setMessages(loaded);
        setMessagesLoading(false);

        // Auto-scroll if user is near bottom
        if (isNearBottomRef.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        } else {
          setShowScrollBottom(true);
        }
      },
      err => {
        handleFirestoreError(err, 'Listen Scene Messages');
        setMessagesLoading(false);
        // If security rules rejected the read (e.g., membership was revoked)
        if (err?.code === 'permission-denied') {
          setAccessRevoked(true);
        }
      }
    );

    return () => {
      unsubMessages();
    };
  }, [scene?.id, scene?.isFirestore, currentUser?.uid, isAuthorized, accessRevoked]);

  // Handle scroll detection for smart auto-scroll
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceToBottom < 100;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      setShowScrollBottom(false);
    }
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setShowScrollBottom(false);
    isNearBottomRef.current = true;
  };

  const formatMessageTime = (ts: any): string => {
    if (!ts) return 'Just now';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const isCancelled = scene?.status === 'cancelled';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || text.length > 1000 || isSending || isCancelled) return;

    if (!currentUser) {
      openAuthPrompt('Sign in with Google to send messages in the group chat', {
        type: 'chat',
        sceneId: scene?.id || sceneId,
        text
      });
      return;
    }

    if (!isAuthorized) {
      showToast('Only approved participants or the host can send messages.');
      return;
    }

    // Real Firestore scene messaging
    if (scene?.isFirestore && db) {
      setIsSending(true);
      try {
        const senderName =
          activeProfile?.displayName || currentUser.displayName || 'Anonymous';
        await addDoc(collection(db, 'scenes', scene.id, 'messages'), {
          senderId: currentUser.uid,
          senderDisplayName: senderName,
          text,
          createdAt: serverTimestamp()
        });
        setInputText('');
        setTimeout(() => scrollToBottom(true), 80);
      } catch (err: any) {
        handleFirestoreError(err, 'Send Scene Message');
        showToast('Could not send message. Please try again.');
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Fallback for local demo sample scenes
    const timeStr = new Date().toLocaleTimeString('en-PK', {
      timeZone: 'Asia/Karachi',
      hour: 'numeric',
      minute: '2-digit'
    });

    updateStore(s => ({
      ...s,
      messages: {
        ...s.messages,
        [scene?.id || sceneId]: [
          ...(s.messages[scene?.id || sceneId] || []),
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

  // --- RENDERING GUARDS ---

  if (sceneLoading) {
    return (
      <div className="view empty-state" style={{ padding: '60px 20px' }}>
        <span className="spinner" style={{ width: 28, height: 28, margin: '0 auto 16px' }}></span>
        <h3>Loading scene chat...</h3>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="view empty-state">
        <h1>Scene not found</h1>
        <p>It might have been removed or cancelled.</p>
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

  if (!currentUser) {
    return (
      <div className="view">
        <div className="page-title-top">
          <span className="tiny-overline">SCENE GROUP CHAT</span>
          <h1>Sign in required</h1>
          <p>Sign in with your Google account to access this scene's real-time group chat.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            type="button"
            className="button dark"
            onClick={() => openAuthPrompt('Sign in to access group chat', { type: 'chat', sceneId: scene.id })}
          >
            Sign in with Google
          </button>
          <button
            type="button"
            className="button"
            style={{ background: '#ede8e1' }}
            onClick={() => navigate(`scene/${scene.id}`)}
          >
            Back to scene
          </button>
        </div>
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="view empty-state" style={{ padding: '60px 20px' }}>
        <span className="spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }}></span>
        <p>Verifying chat access...</p>
      </div>
    );
  }

  if (accessRevoked || (!isHost && membershipStatus !== 'approved' && !store.joined.includes(scene.id))) {
    return (
      <div className="view">
        <div className="chat-header" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className="round-control"
            onClick={() => navigate(`scene/${scene.id}`)}
            aria-label="Back to scene"
          >
            <Icon name="back" size={19} />
          </button>
          <div className="chat-scene-icon">
            <img src={`/assets/${scene.image || 'futsal'}.svg`} alt="" loading="lazy" />
          </div>
          <div>
            <strong>{scene.title}</strong>
            <span>Restricted Scene Chat</span>
          </div>
        </div>

        <div className="chat-revoked-banner">
          <Icon name="shield" size={24} />
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>
              Chat Access Restricted
            </strong>
            <span>
              You are not authorized to view this chat or your spot was released.
              Only the host and approved participants have access.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="button dark"
          onClick={() => navigate(`scene/${scene.id}`)}
        >
          Back to scene details <Icon name="arrow" size={16} />
        </button>
      </div>
    );
  }

  // Local demo fallback messages
  const demoFallbackMessages = !scene.isFirestore ? store.messages[scene.id] || [] : [];

  return (
    <div className="view chat-view">
      {/* Top Scene Header */}
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
          <img src={`/assets/${scene.image || 'futsal'}.svg`} alt="" loading="lazy" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{scene.title}</strong>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {scene.isFirestore ? (
              <span className="live-indicator-pill" style={{ fontSize: '9px', padding: '2px 6px' }}>
                LIVE GROUP CHAT
              </span>
            ) : (
              <span>Demo group chat</span>
            )}
            <span>· {scene.going} participants · Asia/Karachi</span>
          </span>
        </div>
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="chat-cancelled-banner">
          <Icon name="info" size={18} />
          <span>
            <strong>Scene cancelled:</strong> The host has cancelled this meetup. Past chat history remains visible, but sending new messages is closed.
          </span>
        </div>
      )}

      {/* Message History */}
      <div
        className="chat-scroll-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <div className="chat-day">PAKISTAN STANDARD TIME (PKT)</div>

        {messagesLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#918b99' }}>
            <span className="spinner" style={{ width: 18, height: 18, margin: '0 auto 8px' }}></span>
            <small style={{ display: 'block' }}>Loading messages...</small>
          </div>
        ) : scene.isFirestore ? (
          <>
            {messages.map(m => {
              const isMine = m.senderId === currentUser.uid;
              const initials = (m.senderDisplayName || 'U')
                .split(' ')
                .map(p => p[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={m.id}
                  className={`bubble-avatar-row ${isMine ? 'mine' : ''}`}
                >
                  {!isMine && (
                    <div
                      className="avatar avatar-lavender tiny"
                      title={m.senderDisplayName}
                      style={{ flexShrink: 0, width: 28, height: 28, fontSize: 10 }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className={`bubble ${isMine ? 'mine' : ''}`}>
                    {!isMine && (
                      <span className="chat-sender-name">
                        {m.senderDisplayName}
                        {m.senderId === scene.hostId && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: '9px',
                              background: '#e1e8ff',
                              color: '#34468f',
                              padding: '1px 5px',
                              borderRadius: 4,
                              fontWeight: 900
                            }}
                          >
                            HOST
                          </span>
                        )}
                      </span>
                    )}
                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {m.text}
                    </p>
                    <time>{formatMessageTime(m.createdAt)}</time>
                  </div>
                </div>
              );
            })}
            {!messages.length && (
              <div className="chat-first">
                No messages yet. Say salam to the group! 👋
              </div>
            )}
          </>
        ) : (
          <>
            {demoFallbackMessages.map((m, idx) => {
              const isMine = m.from === 'me';
              return (
                <div key={idx} className={`bubble ${isMine ? 'mine' : ''}`}>
                  {!isMine && <small>{m.name}</small>}
                  <p>{m.text}</p>
                  <time>{m.time}</time>
                </div>
              );
            })}
            {!demoFallbackMessages.length && (
              <div className="chat-first">No messages yet. Say hello 👋</div>
            )}
          </>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        {showScrollBottom && (
          <button
            type="button"
            className="chat-scroll-bottom-btn"
            onClick={() => scrollToBottom(true)}
          >
            <span>↓ Jump to latest</span>
          </button>
        )}
      </div>

      {/* Compose Form */}
      <form id="chat-form" className="chat-compose" onSubmit={handleSendMessage}>
        <input
          name="message"
          maxLength={1000}
          aria-label="Message"
          placeholder={
            isCancelled
              ? 'This scene is cancelled (read-only history)'
              : 'Type a message to the group...'
          }
          autoComplete="off"
          disabled={isCancelled || isSending}
          required
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!inputText.trim() || inputText.trim().length > 1000 || isSending || isCancelled}
        >
          {isSending ? (
            <span className="spinner" style={{ width: 14, height: 14, borderColor: '#fff' }}></span>
          ) : (
            <Icon name="send" size={20} />
          )}
        </button>
      </form>

      {inputText.length > 800 && (
        <div className="chat-char-counter">
          {inputText.length} / 1000 characters
        </div>
      )}

      <div className="chat-disclaimer">
        {scene.isFirestore
          ? 'Live Cloud Firestore group chat · End-to-end authorized for scene host and approved participants'
          : 'Offline demo — messages stay on this device.'}
      </div>
    </div>
  );
};
