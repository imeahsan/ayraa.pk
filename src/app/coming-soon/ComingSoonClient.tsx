"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./coming-soon.module.css";

interface Message {
  id: number;
  sender: "concierge" | "user";
  text: string;
  time: string;
  status?: "sending" | "sent" | "read";
}

export function ComingSoonClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "concierge",
      text: "Assalamu Alaikum! Welcome to Ayraa Collection. 🌸",
      time: "19:07",
    },
    {
      id: 2,
      sender: "concierge",
      text: "Our premium Pakistani Summer Lawn suitings, soft-finished luxury bed sheets, and handcrafted home textiles are launching soon. Exclusive pre-booking is now open!",
      time: "19:08",
    },
  ]);

  const [inputValue, setInputValue] = useState(
    "Hi Ayraa, I am interested in pre-booking your Pakistani Summer Lawn Collection and Luxury Bed Sheets!"
  );
  
  const [isRedirecting, setIsRedirecting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChatStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isRedirecting) return;

    // 1. Get current time
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

    // 2. Add user message to state with "sending" status
    const userMessageId = Date.now();
    const userMsg: Message = {
      id: userMessageId,
      sender: "user",
      text: inputValue,
      time: timeStr,
      status: "sending"
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsRedirecting(true);
    const sentText = inputValue;
    setInputValue(""); // Clear input after sending

    // 3. Step 2: Show delivered (sent)
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMessageId ? { ...m, status: "sent" } : m))
      );
    }, 300);

    // 4. Step 3: Show read (blue ticks) and redirect to WhatsApp
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMessageId ? { ...m, status: "read" } : m))
      );

      // Concierge typing response
      const conciergeResponseId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: conciergeResponseId,
          sender: "concierge",
          text: "Connecting you with our personal shopper via WhatsApp... 💫",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        }
      ]);

      const formattedPhone = "923295822495"; // User's requested WhatsApp number
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(sentText)}`;
      
      // Open WhatsApp link in a new tab
      window.open(whatsappUrl, "_blank");
      setIsRedirecting(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.silkOverlay} />
      
      <main className={styles.content}>
        <h1 className={styles.brand}>Ayraa</h1>
        <hr className={styles.divider} />
        
        <div className={styles.glowRing}>
          <div className={styles.glowRingInner}>
            🌸
          </div>
        </div>

        <h2 className={styles.title}>Pakistani Summer Lawn &amp; Luxury Bed Sheets</h2>
        
        <p className={styles.subtitle}>
          Prepare your home and wardrobe for the season. We are curating our premium 
          Summer Lawn collections, soft-finished luxury bed sheets, and handcrafted home textiles. Launching shortly.
        </p>

        {/* WhatsApp Chat Dialogue Box */}
        <div className={styles.chatBox}>
          <div className={styles.chatHeader}>
            <div className={styles.chatAvatar}>
              A
              <div className={styles.statusDot} />
            </div>
            <div className={styles.chatInfo}>
              <h4 className={styles.chatTitle}>Ayraa Luxury Concierge</h4>
              <span className={styles.chatSubtitle}>Online • Instant Assistance</span>
            </div>
             <div className={styles.whatsappBadge}>
              <svg className={styles.whatsappHeaderIcon} viewBox="0 0 24 24">
                <path d="M19.071 4.929A9.936 9.936 0 0 0 12.008 2c-5.513 0-10 4.487-10 10 0 1.761.46 3.473 1.332 4.985L2 22l5.166-1.356A9.914 9.914 0 0 0 12.004 22c5.513 0 10-4.487 10-10a9.936 9.936 0 0 0-2.933-7.071zm-7.067 15.352c-1.562 0-3.093-.418-4.43-1.21l-.317-.188-3.292.863.878-3.21-.207-.33a8.232 8.232 0 0 1-1.263-4.331c0-4.549 3.702-8.251 8.257-8.251 2.204 0 4.276.859 5.836 2.42a8.212 8.212 0 0 1 2.418 5.836c-.004 4.553-3.706 8.251-8.257 8.251zm4.532-6.195c-.248-.124-1.468-.724-1.695-.807-.227-.083-.393-.124-.558.124-.165.248-.64.807-.785.973-.145.165-.29.186-.537.062a6.764 6.764 0 0 1-1.996-1.23 7.458 7.458 0 0 1-1.38-1.72c-.145-.248-.015-.383.109-.506.112-.112.248-.29.372-.435.124-.145.165-.248.248-.414.083-.165.041-.31-.02-.435-.062-.124-.558-1.345-.765-1.841-.2-.483-.4-.414-.558-.423-.144-.008-.31-.008-.475-.008a.91.91 0 0 0-.661.31c-.227.248-.868.848-.868 2.068 0 1.22.888 2.397 1.012 2.563.124.165 1.747 2.668 4.233 3.74.59.254 1.052.406 1.412.52.593.189 1.133.162 1.56.098.475-.07 1.468-.6 1.674-1.179.207-.579.207-1.075.145-1.179-.062-.104-.227-.165-.475-.29z"/>
              </svg>
             </div>
          </div>
          
          <div className={styles.chatMessages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.msgBubble} ${
                  msg.sender === "concierge" ? styles.msgConcierge : styles.msgUser
                }`}
              >
                <div className={styles.msgText}>{msg.text}</div>
                <div className={styles.msgMeta}>
                  <span className={styles.msgTime}>{msg.time}</span>
                  {msg.sender === "user" && (
                    <span className={styles.msgStatus}>
                      {msg.status === "sending" && (
                        <svg className={styles.tickIcon} viewBox="0 0 16 16">
                          <path fill="currentColor" d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      )}
                      {msg.status === "sent" && (
                        <svg className={styles.tickIcon} viewBox="0 0 16 16">
                          <path fill="currentColor" d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-3-3a.5.5 0 0 0-.708-.708L5 4.293 1.854 1.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7z"/>
                        </svg>
                      )}
                      {msg.status === "read" && (
                        <svg className={`${styles.tickIcon} ${styles.tickBlue}`} viewBox="0 0 16 16">
                          <path fill="currentColor" d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-3-3a.5.5 0 0 0-.708-.708L5 4.293 1.854 1.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7z"/>
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatStart} className={styles.chatForm}>
            <div className={styles.chatInputWrapper}>
              <button type="button" className={styles.emojiBtn} aria-label="Emojis">
                😀
              </button>
              <textarea
                placeholder={isRedirecting ? "Connecting..." : "Type your inquiry..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.chatInput}
                disabled={isRedirecting}
                required
                aria-label="WhatsApp message text"
                rows={2}
              />
            </div>
            <button
              type="submit"
              className={styles.chatBtn}
              disabled={isRedirecting || !inputValue.trim()}
              aria-label="Send WhatsApp message"
            >
              <svg className={styles.sendIcon} viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
         </div>
      </main>
    </div>
  );
}
