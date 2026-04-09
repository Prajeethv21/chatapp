import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type ConversationType = 'room' | 'direct'
type MessageAuthor = 'me' | 'them'

type Message = {
  id: number
  author: MessageAuthor
  text: string
  time: string
}

type Conversation = {
  id: string
  type: ConversationType
  title: string
  subtitle: string
  meta: string
  accent: string
  online: string
  unread: number
  replies: string[]
  messages: Message[]
}

type UserProfile = {
  name: string
  role: string
}

const seededConversations: Conversation[] = [
  {
    id: 'mumbai-core-team',
    type: 'room',
    title: 'Mumbai Core Team',
    subtitle: 'Product room',
    meta: '12 members',
    accent: '#6d7dff',
    online: '8 online',
    unread: 2,
    replies: [
      'Let us lock the UI first and then connect backend events.',
      'Looks good overall. We can keep this layout for submission.',
      'I can help with API integration once this demo is done.',
    ],
    messages: [
      {
        id: 1,
        author: 'them',
        text: 'Can we keep the room list simple and clean for now?',
        time: '09:12',
      },
      {
        id: 2,
        author: 'me',
        text: 'Yes, I will keep it simple and improve the spacing.',
        time: '09:14',
      },
      {
        id: 3,
        author: 'them',
        text: 'Great. Add typing indicator and keep the input fixed at bottom.',
        time: '09:16',
      },
    ],
  },
  {
    id: 'design-adda',
    type: 'room',
    title: 'Design Adda',
    subtitle: 'Experiments and polish',
    meta: '5 members',
    accent: '#ff8f5d',
    online: '3 online',
    unread: 0,
    replies: [
      'This looks neat. We can keep this version.',
      'Let us keep controls minimal in the final submission.',
      'Small spacing fixes and it should be ready.',
    ],
    messages: [
      {
        id: 1,
        author: 'them',
        text: 'Can we make the message box a bit more visible?',
        time: '10:02',
      },
      {
        id: 2,
        author: 'me',
        text: 'Sure, I will improve the message box and send button contrast.',
        time: '10:05',
      },
    ],
  },
  {
    id: 'ananya-sharma',
    type: 'direct',
    title: 'Ananya Sharma',
    subtitle: 'Product designer',
    meta: 'Direct chat',
    accent: '#46c8a3',
    online: 'Online now',
    unread: 1,
    replies: [
      'Nice work. Please share mobile screenshot too.',
      'Good progress. It is looking stable now.',
      'I can quickly review responsive view if needed.',
    ],
    messages: [
      {
        id: 1,
        author: 'them',
        text: 'Can you share the latest sign-in screen version?',
        time: '08:48',
      },
      {
        id: 2,
        author: 'me',
        text: 'Yes, I updated it and will push the latest code soon.',
        time: '08:50',
      },
    ],
  },
  {
    id: 'rahul-verma',
    type: 'direct',
    title: 'Rahul Verma',
    subtitle: 'Engineering lead',
    meta: 'Direct chat',
    accent: '#ffd166',
    online: 'Away',
    unread: 0,
    replies: [
      'Build is fine. We can connect real sockets later.',
      'Please add one small status line in header.',
      'After UI submission, we can add backend support.',
    ],
    messages: [
      {
        id: 1,
        author: 'them',
        text: 'Is this fully real-time or demo data?',
        time: 'Yesterday',
      },
      {
        id: 2,
        author: 'me',
        text: 'For now this is local demo logic, but easy to connect with socket later.',
        time: 'Yesterday',
      },
    ],
  },
]

const conversationTabs: Array<{ label: string; value: ConversationType | 'all' }> = [
  { label: 'All chats', value: 'all' },
  { label: 'Rooms', value: 'room' },
  { label: 'Direct', value: 'direct' },
]

const initialDrafts = Object.fromEntries(
  seededConversations.map((conversation) => [conversation.id, '']),
) as Record<string, string>

function getTimeStamp() {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date())
}

function pickReply(conversation: Conversation, text: string) {
  const normalized = text.toLowerCase()

  if (normalized.includes('design')) {
    return 'Design is looking good. We can keep this version for now.'
  }

  if (normalized.includes('build') || normalized.includes('socket')) {
    return 'Looks fine. We can connect this with socket backend in next phase.'
  }

  if (normalized.includes('mobile')) {
    return 'Mobile layout looks fine. Just reduce spacing a little.'
  }

  const choices = conversation.replies
  return choices[Math.floor(Math.random() * choices.length)]
}

function App() {
  const [signedIn, setSignedIn] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Prajeeth',
    role: 'Frontend developer',
  })
  const [draftName, setDraftName] = useState('Prajeeth')
  const [draftRole, setDraftRole] = useState('Frontend developer')
  const [activeTab, setActiveTab] = useState<ConversationType | 'all'>('all')
  const [activeConversationId, setActiveConversationId] = useState(
    seededConversations[0]?.id ?? '',
  )
  const [conversations, setConversations] = useState(seededConversations)
  const [drafts, setDrafts] = useState(initialDrafts)
  const [typingConversationId, setTypingConversationId] = useState<string | null>(null)
  const nextMessageId = useRef(100)
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const timeoutsRef = useRef<number[]>([])

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [activeConversationId, conversations],
  )

  const visibleConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        if (activeTab === 'all') {
          return true
        }

        return conversation.type === activeTab
      }),
    [activeTab, conversations],
  )

  useEffect(() => {
    const messageList = messageListRef.current

    if (!messageList) {
      return
    }

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: 'smooth',
    })
  }, [activeConversation?.messages.length, typingConversationId])

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    },
    [],
  )

  function submitSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfile({
      name: draftName.trim() || 'Prajeeth',
      role: draftRole.trim() || 'Frontend developer',
    })
    setSignedIn(true)
  }

  function goBackToSignIn() {
    setTypingConversationId(null)
    setSignedIn(false)
  }

  function scheduleReply(conversationId: string, outgoingText: string) {
    setTypingConversationId(conversationId)

    const replyDelay = window.setTimeout(() => {
      const conversation = conversations.find((item) => item.id === conversationId)

      if (!conversation) {
        return
      }

      const replyMessage: Message = {
        id: (nextMessageId.current += 1),
        author: 'them',
        text: pickReply(conversation, outgoingText),
        time: getTimeStamp(),
      }

      setConversations((previousConversations) =>
        previousConversations.map((item) =>
          item.id === conversationId
            ? {
                ...item,
                messages: [...item.messages, replyMessage],
                unread: item.id === activeConversationId ? 0 : item.unread + 1,
              }
            : item,
        ),
      )

      setTypingConversationId(null)
    }, 1100)

    timeoutsRef.current.push(replyDelay)
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeConversation) {
      return
    }

    const messageText = drafts[activeConversation.id]?.trim()

    if (!messageText) {
      return
    }

    const outgoingMessage: Message = {
      id: (nextMessageId.current += 1),
      author: 'me',
      text: messageText,
      time: getTimeStamp(),
    }

    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages: [...conversation.messages, outgoingMessage],
              unread: 0,
            }
          : conversation,
      ),
    )

    setDrafts((previousDrafts) => ({
      ...previousDrafts,
      [activeConversation.id]: '',
    }))

    scheduleReply(activeConversation.id, messageText)
  }

  function handleDraftChange(conversationId: string, value: string) {
    setDrafts((previousDrafts) => ({
      ...previousDrafts,
      [conversationId]: value,
    }))
  }

  if (!signedIn) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="auth-copy">
            <span className="eyebrow">Live workspace</span>
            <h1>Real-time chat application.</h1>
            <p>
              This project includes sign in, chat rooms, direct messages,
              instant messaging, and typing indicators.
            </p>

            <div className="auth-highlights" aria-label="App highlights">
              <article>
                <strong>User login</strong>
                <span>Simple profile based sign-in screen.</span>
              </article>
              <article>
                <strong>Real-time feel</strong>
                <span>Instant chat updates with typing indicator.</span>
              </article>
              <article>
                <strong>Responsive UI</strong>
                <span>Works on desktop and mobile screens.</span>
              </article>
            </div>
          </div>

          <form className="auth-form" onSubmit={submitSignIn}>
            <div className="auth-card">
              <div className="brand-mark" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <h2>Welcome back</h2>
              <p>Enter your details to continue.</p>

              <label>
                Display name
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Prajeeth"
                  autoComplete="name"
                />
              </label>

              <label>
                Role
                <input
                  value={draftRole}
                  onChange={(event) => setDraftRole(event.target.value)}
                  placeholder="Frontend developer"
                  autoComplete="organization-title"
                />
              </label>

              <button className="primary-button" type="submit">
                Enter workspace
              </button>

              <p className="auth-footnote">Internship demo project.</p>
            </div>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <span className="eyebrow">Workspace</span>
            <h1>Prajeeth Chat</h1>
          </div>
          <span className="status-pill">Live now</span>
        </div>

        <div className="profile-card">
          <div className="avatar avatar-large" aria-hidden="true">
            {profile.name
              .split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div>
            <strong>{profile.name}</strong>
            <span>{profile.role}</span>
          </div>
        </div>

        <div className="mini-metrics" aria-label="Workspace metrics">
          <article>
            <strong>18</strong>
            <span>messages today</span>
          </article>
          <article>
            <strong>3</strong>
            <span>active threads</span>
          </article>
          <article>
            <strong>5</strong>
            <span>team members online</span>
          </article>
        </div>

        <div className="tab-strip" role="tablist" aria-label="Conversation filters">
          {conversationTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              className={activeTab === tab.value ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="conversation-list">
          {visibleConversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId

            return (
              <button
                key={conversation.id}
                type="button"
                className={isActive ? 'conversation-row active' : 'conversation-row'}
                onClick={() => {
                  setActiveConversationId(conversation.id)
                  setConversations((previousConversations) =>
                    previousConversations.map((item) =>
                      item.id === conversation.id ? { ...item, unread: 0 } : item,
                    ),
                  )
                }}
              >
                <span
                  className="avatar"
                  style={{ background: conversation.accent }}
                  aria-hidden="true"
                >
                  {conversation.title
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>

                <span className="conversation-copy">
                  <span className="conversation-topline">
                    <strong>{conversation.title}</strong>
                    <span>{conversation.online}</span>
                  </span>
                  <span className="conversation-preview">
                    {conversation.subtitle} · {conversation.meta}
                  </span>
                </span>

                {conversation.unread > 0 ? (
                  <span className="badge">{conversation.unread}</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div className="chat-header-copy">
            <span className="eyebrow">
              {activeConversation?.type === 'room' ? 'Room' : 'Direct message'}
            </span>
            <h2>{activeConversation?.title}</h2>
            <p>
              {activeConversation?.subtitle} · {activeConversation?.meta}
            </p>
          </div>

          <div className="chat-actions" aria-label="Chat actions">
            <button type="button" onClick={goBackToSignIn}>
              Back
            </button>
            <button type="button">Search</button>
            <button type="button">Details</button>
          </div>
        </header>

        <div className="chat-messages" ref={messageListRef}>
          {activeConversation?.messages.map((message) => (
            <article
              key={message.id}
              className={message.author === 'me' ? 'message outgoing' : 'message incoming'}
            >
              <div className="message-bubble">
                <p>{message.text}</p>
              </div>
              <span className="message-meta">{message.time}</span>
            </article>
          ))}

          {typingConversationId === activeConversation?.id ? (
            <article className="message incoming typing-state" aria-live="polite">
              <div className="message-bubble typing-bubble">
                <span className="typing-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span>
                  {activeConversation?.type === 'room'
                    ? `${activeConversation.title} is typing`
                    : `${activeConversation?.title} is typing`}
                </span>
              </div>
            </article>
          ) : null}
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <div className="composer-row">
            <button type="button" className="icon-button" aria-label="Attach file">
              +
            </button>
            <label className="composer-field" htmlFor="message-input">
              <span className="sr-only">Message</span>
              <input
                id="message-input"
                value={drafts[activeConversation?.id ?? ''] ?? ''}
                onChange={(event) =>
                  activeConversation
                    ? handleDraftChange(activeConversation.id, event.target.value)
                    : undefined
                }
                placeholder={`Message ${activeConversation?.title ?? 'chat'}`}
                autoComplete="off"
              />
            </label>
            <button type="button" className="icon-button" aria-label="Emoji picker">
              :
            </button>
            <button type="submit" className="send-button">
              Send
            </button>
          </div>

          <div className="composer-footer">
            <span>
              {drafts[activeConversation?.id ?? '']?.trim()
                ? 'Draft ready to send'
                : 'Use the composer to start a conversation'}
            </span>
            <span>
              {activeConversation?.type === 'room'
                ? `${activeConversation.online} in this room`
                : activeConversation?.online}
            </span>
          </div>
        </form>
      </section>

      <aside className="insights-panel">
        <div className="insight-card highlight">
          <span className="eyebrow">Active thread</span>
          <h3>{activeConversation?.title}</h3>
          <p>
            {activeConversation?.type === 'room'
              ? 'Room chat for group discussion and quick updates.'
              : 'Direct chat between two users with typing status.'}
          </p>
        </div>

        <div className="insight-card">
          <span className="eyebrow">Presence</span>
          <div className="insight-list">
            <div>
              <strong>8</strong>
              <span>online now</span>
            </div>
            <div>
              <strong>2</strong>
              <span>typing signals</span>
            </div>
            <div>
              <strong>11</strong>
              <span>new messages</span>
            </div>
          </div>
        </div>

        <div className="insight-card">
          <span className="eyebrow">Shortcuts</span>
          <ul className="shortcut-list">
            <li>Press Enter to send</li>
            <li>Switch tabs to filter rooms and DMs</li>
            <li>Open a thread to clear unread counts</li>
          </ul>
        </div>
      </aside>
    </main>
  )
}

export default App
