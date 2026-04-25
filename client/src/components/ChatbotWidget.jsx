import React, { useState } from 'react';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="chatbot-widget">
            {/* Chat Icon Button - Always visible */}
            <button
                className="chatbot-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Open Chat"
                aria-label="Open chatbot"
            >
                <span className="material-symbols-outlined">
                    {isOpen ? 'close' : 'support_agent'}
                </span>
            </button>

            {/* Chat Window - Appears as popup when open */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h3>Ceylon Gems Support</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="close-btn"
                            aria-label="Close chatbot"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="chatbot-body">
                        <iframe
                            src="https://interfaces.zapier.com/embed/chatbot/cmoe17wcd000p15z9yxep2mdg"
                            height="100%"
                            width="100%"
                            allow="clipboard-write *"
                            style={{
                                border: 'none',
                                borderRadius: '0 0 8px 8px'
                            }}
                            title="Ceylon Gems Chatbot"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;