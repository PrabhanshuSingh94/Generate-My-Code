import React, { useState, useEffect, useRef } from "react";
import { Copy, Send, Plus, Edit3, Check, X, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [tempTitle, setTempTitle] = useState("");
  const [copySuccess, setCopySuccess] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [tempMessage, setTempMessage] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Get current chat object
  const currentChat = chats.find((chat) => chat.id === currentChatId);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, isTyping]);

  // Copy to clipboard function
  const copyToClipboard = async (text, codeBlockId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(prev => ({ ...prev, [codeBlockId]: "Copied!" }));
      setTimeout(() => {
        setCopySuccess(prev => {
          const newState = { ...prev };
          delete newState[codeBlockId];
          return newState;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      setCopySuccess(prev => ({ ...prev, [codeBlockId]: "Failed to copy" }));
      setTimeout(() => {
        setCopySuccess(prev => {
          const newState = { ...prev };
          delete newState[codeBlockId];
          return newState;
        });
      }, 2000);
    }
  };

  
   const renderBotMessage = (content, messageIndex) => {
    if (!content) return null;

    return (
      <ReactMarkdown
        children={content}
        components={{
          code({node, inline, className, children, ...props}) {
            const language = className ? className.replace('language-', '') : 'javascript';
            const codeBlockId = `${messageIndex}-${Math.random()}`;
            return !inline ? (
              <div className="my-4 border border-gray-300 rounded-lg overflow-hidden relative">
                <div className="flex justify-between items-center bg-gray-100 px-4 py-2 border-b border-gray-300">
                  <span className="text-xs text-gray-600 font-medium">{language}</span>
                  <div className="relative">
                    <button
                      onClick={() => copyToClipboard(children, codeBlockId)}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs text-gray-700 transition-colors"
                    >
                      <Copy size={12} /> Copy code
                    </button>
                    {copySuccess[codeBlockId] && (
                      <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        {copySuccess[codeBlockId]}
                      </div>
                    )}
                  </div>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 overflow-x-auto m-0 font-mono text-sm leading-relaxed">
                  <code>{children}</code>
                </pre>
              </div>
            ) : (
              <code className="bg-gray-200 px-1 rounded">{children}</code>
            );
          }
        }}
      />
    );
  };


  // Typing animation function
 const typeMessage = (message, chatId) => {
  setIsTyping(true);

  // Detect if the whole message is just a code block
  const codeBlockRegex = /^```[\s\S]*```$/;

  if (codeBlockRegex.test(message)) {
    // Directly render full code block (no typing effect)
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const messages = [...chat.messages];
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content: message,
            isTyping: false
          };
          return { ...chat, messages };
        }
        return chat;
      })
    );
    setIsTyping(false);
    return;
  }

  // Otherwise, do typing effect for normal text (headings, paragraphs, etc.)
  const words = message.split(' ');
  let currentText = '';
  let wordIndex = 0;

  const typeInterval = setInterval(() => {
    if (wordIndex < words.length) {
      currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];

      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat.id === chatId) {
            const messages = [...chat.messages];
            if (messages.length > 0 && messages[messages.length - 1].role === "bot") {
              messages[messages.length - 1] = {
                ...messages[messages.length - 1],
                content: currentText,
                isTyping: true
              };
            }
            return { ...chat, messages };
          }
          return chat;
        })
      );

      wordIndex++;
    } else {
      setIsTyping(false);
      clearInterval(typeInterval);
    }
  }, 50);
};



  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    let chatId = currentChatId;
    let updatedChats = [...chats];

    if (!chatId) {
      const newChat = {
        id: Date.now(),
        title: input.length > 40 ? input.substring(0, 40) + "..." : input.trim(),
        messages: [],
        createdAt: new Date()
      };
      updatedChats = [newChat, ...updatedChats];
      chatId = newChat.id;
      setCurrentChatId(chatId);
    } else {
      // Update existing chat title if it's still "New Chat"
      const currentChat = updatedChats.find(chat => chat.id === chatId);
      if (currentChat && currentChat.title === "New Chat") {
        updatedChats = updatedChats.map(chat =>
          chat.id === chatId
            ? { ...chat, title: input.length > 40 ? input.substring(0, 40) + "..." : input.trim() }
            : chat
        );
      }
    }

    const userMessage = { role: "user", content: input.trim() };
    updatedChats = updatedChats.map((chat) => {
      if (chat.id === chatId) {
        return { ...chat, messages: [...chat.messages, userMessage] };
      }
      return chat;
    });

    setChats(updatedChats);
    setInput("");

    const botMessage = { role: "bot", content: "", isTyping: true };
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat
      )
    );
    // Start blinking animation
    let blinkState = 0;
    const blinkMessages = [
      "Generating solution...",
      "Finding the best solution...",
      "Generating solution...",
      "Finding the best solution..."
    ];

    const blinkInterval = setInterval(() => {
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === chatId) {
            const messages = [...chat.messages];
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content: blinkMessages[blinkState % blinkMessages.length],
              isTyping: true
            };
            return { ...chat, messages };
          }
          return chat;
        })
      );
      blinkState++;
    }, 3000);

    try {
      const res = await fetch("http://localhost:3000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input.trim() })
      });
      const data = await res.json();
      clearInterval(blinkInterval);
      typeMessage(data.generated, chatId);
    } catch (err) {
      console.error("Error fetching response:", err);
      setIsTyping(false);
      const errorMessage = {
        role: "bot",
        content: "Sorry, I encountered an error while generating the response. Please try again.",
        isTyping: false
      };

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === chatId) {
            const messages = [...chat.messages];
            messages[messages.length - 1] = errorMessage;
            return { ...chat, messages };
          }
          return chat;
        })
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
      createdAt: new Date()
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setInput("");
  };

  const handleSelectChat = (id) => {
    if (isTyping) return;
    setCurrentChatId(id);
    setInput("");
    setEditingChatId(null);
  };

  const startEditingTitle = (id, currentTitle) => {
    setEditingChatId(id);
    setTempTitle(currentTitle);
  };

  const saveEditedTitle = (id) => {
    if (tempTitle.trim()) {
      setChats((prevChats) =>
        prevChats.map((chat) => (chat.id === id ? { ...chat, title: tempTitle.trim() } : chat))
      );
    }
    setEditingChatId(null);
    setTempTitle("");
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setTempTitle("");
  };

  // Message editing functions
  const startEditingMessage = (messageIndex, content) => {
    setEditingMessageId(messageIndex);
    setTempMessage(content);
  };

  const saveEditedMessage = async (messageIndex) => {
    if (!tempMessage.trim()) return;

    const updatedChats = chats.map((chat) => {
      if (chat.id === currentChatId) {
        const messages = [...chat.messages];
        messages[messageIndex] = { ...messages[messageIndex], content: tempMessage.trim() };
        const newMessages = messages.slice(0, messageIndex + 1);
        return { ...chat, messages: newMessages };
      }
      return chat;
    });

    setChats(updatedChats);
    setEditingMessageId(null);
    setTempMessage("");

    const chatId = currentChatId;
    const botMessage = { role: "bot", content: "Generate solution...", isTyping: true };
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, botMessage] } : chat
      )
    );

    let blinkState = 0;
    const blinkMessages = [
      "Generating solution...",
      "Finding the best solution...",
      "Generating solution...",
      "Finding the best solution..."
    ];

    const blinkInterval = setInterval(() => {
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === chatId) {
            const messages = [...chat.messages];
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content: blinkMessages[blinkState % blinkMessages.length],
              isTyping: true
            };
            return { ...chat, messages };
          }
          return chat;
        })
      );
      blinkState++;
    }, 3000);

    try {
      const res = await fetch("http://localhost:3000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: tempMessage.trim() })
      });
      const data = await res.json();
      clearInterval(blinkInterval);
      typeMessage(data.generated, chatId);
    } catch (err) {
      console.error("Error fetching response:", err);
      setIsTyping(false);
      const errorMessage = {
        role: "bot",
        content: "Sorry, I encountered an error while generating the response. Please try again.",
        isTyping: false
      };

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === chatId) {
            const messages = [...chat.messages];
            messages[messages.length - 1] = errorMessage;
            return { ...chat, messages };
          }
          return chat;
        })
      );
    }
  };

  const cancelMessageEditing = () => {
    setEditingMessageId(null);
    setTempMessage("");
  };

  return (
    <div className="h-screen bg-white text-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 h-screen overflow-y-auto bg-gray-900 text-white flex flex-col">
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${chat.id === currentChatId ? "bg-gray-800" : "hover:bg-gray-800"
                }`}
              onClick={() => handleSelectChat(chat.id)}
            >
              <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />

              {editingChatId === chat.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditedTitle(chat.id);
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    onBlur={() => saveEditedTitle(chat.id)}
                  />
                  <button
                    onClick={() => saveEditedTitle(chat.id)}
                    className="text-green-400 hover:text-green-300 p-1"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className="flex-1 truncate text-sm cursor-pointer"
                    onDoubleClick={() => startEditingTitle(chat.id, chat.title)}
                  >
                    {chat.title}
                  </span>
                  {chat.id === currentChatId && (
                    <button
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTitle(chat.id, chat.title);
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="h-screen overflow-y-auto flex-1 flex flex-col">
        {currentChat ? (
          <>
            <div className="border-b border-gray-200 p-4">
              <h1 className="text-lg font-medium">{currentChat.title}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentChat.messages.map((msg, idx) => (
                <div key={idx} className="max-w-none">
                  {msg.role === "user" ? (
                    <div className="flex justify-end mb-4 group">
                      <div className="max-w-2xl relative">
                        {editingMessageId === idx ? (
                          <div className="bg-blue-600 text-white px-4 py-3 rounded-3xl rounded-br-md">
                            <textarea
                              value={tempMessage}
                              onChange={(e) => setTempMessage(e.target.value)}
                              className="w-full bg-transparent text-white resize-none border-none outline-none"
                              rows={Math.max(1, tempMessage.split('\n').length)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  saveEditedMessage(idx);
                                }
                                if (e.key === 'Escape') {
                                  cancelMessageEditing();
                                }
                              }}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => saveEditedMessage(idx)}
                                className="px-3 py-1 bg-white bg-opacity-20 text-white rounded-full text-xs hover:bg-opacity-30 transition-colors"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={cancelMessageEditing}
                                className="px-3 py-1 bg-white bg-opacity-20 text-white rounded-full text-xs hover:bg-opacity-30 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="bg-blue-600 text-white px-4 py-3 rounded-3xl rounded-br-md text-sm leading-relaxed">
                              {msg.content}
                            </div>
                            <button
                              onClick={() => startEditingMessage(idx, msg.content)}
                              className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all duration-200 text-xs"
                            >
                              <Edit3 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start mb-4">
                      <div className="max-w-4xl w-full">
                        <div className="bg-gray-50 px-4 py-3 rounded-3xl rounded-bl-md">
                          <div className="prose prose-sm max-w-none text-sm">
                            {renderBotMessage(msg.content, idx)}
                            {msg.isTyping && (
                              <span className="inline-block w-2 h-5 bg-gray-900 animate-pulse ml-1">|</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-end gap-2 bg-gray-50 rounded-3xl px-4 py-2 border border-gray-200 shadow-sm">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Message Alien..."
                    disabled={isTyping}
                    className="flex-1 bg-transparent py-2 resize-none border-none outline-none min-h-6 max-h-48 text-gray-900 placeholder-gray-500"
                    rows={1}
                    style={{ overflow: 'hidden' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className={`p-2 rounded-full transition-all duration-200 ${!input.trim() || isTyping
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-900 text-white hover:bg-gray-700 shadow-sm"
                      }`}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold text-gray-900">ChatGPT Clone</h1>
              <p className="text-gray-600 text-lg max-w-md">
                Start a conversation by creating a new chat or selecting an existing one.
              </p>
              <button
                onClick={handleNewChat}
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;