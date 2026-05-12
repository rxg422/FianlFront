'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './HistoryAI.module.css';
import { Send, Bot } from 'lucide-react';
import api, { getGeminiResponse } from '@/utils/api'; 

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

const History = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'bot', text: '안녕하세요! 전북 역사 AI 챗봇입니다. 원하시는 시대나 인물, 지역에 대해 무엇이든 물어보세요.' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    '후백제를 세운 견훤은 어떤 사람이야?',
    '전주 한옥마을의 유래를 알려줘',
    '군산 근대화 거리 추천 코스 있어?',
    '조선왕조 발상지 유적지 추천해줘',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * [중요] 이전 대화 내역 불러오기 로직
   */
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get('/api/chat/history');
        
        // ★ 오타 수정: response.data.lengeth -> response.data.length
        if (response.data && response.data.length > 0) {
          const historyMsgs: Message[] = [];
          
          response.data.forEach((item: any) => {
            // 사용자의 질문 추가
            historyMsgs.push({ 
              id: Date.now() + Math.random(), 
              sender: 'user', 
              text: item.question 
            });
            // AI의 답변 추가
            historyMsgs.push({ 
              id: Date.now() + Math.random(), 
              sender: 'bot', 
              text: item.answer 
            });
          });
          
          // 기존 인사말 뒤에 내역 붙이기
          setMessages(prev => [...prev, ...historyMsgs]);
        }
      } catch (error) {
        console.error("이전 내역 로드 실패:", error);
      }
    };
    loadHistory();
  }, []);

  /**
   * 메시지 전송 핸들러
   */
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // 1. 사용자 메시지 화면에 추가
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
    setInputText('');
    setIsLoading(true);

    try {
      // 2. 실제 AI 호출 (내부적으로 백엔드 저장까지 수행함)
      const aiReply = await getGeminiResponse(text);

      // 3. AI 답변을 화면에 추가
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: aiReply,
      }]);
    } catch (error) {
      console.error("챗봇 응답 에러:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "죄송합니다. 역사를 조회하는 도중 에러가 발생했습니다. 잠시 후 다시 시도해주세요.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatContainer}>
        <header className={styles.chatHeader}>
          <div className={styles.botProfile}><Bot size={28} /></div>
          <div className={styles.headerInfo}>
            <h2>전북 역사 AI 챗봇</h2>
            <p>나만의 역사 해설사</p>
          </div>
        </header>

        <div className={styles.messageArea}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.isUser : styles.isBot}`}>
              {msg.sender === 'bot' && <div className={styles.botIcon}><Bot size={18} /></div>}
              <div className={styles.messageBubble}>{msg.text}</div>
            </div>
          ))}
          {/* 로딩 표시 */}
          {isLoading && (
            <div className={`${styles.messageWrapper} ${styles.isBot}`}>
              <div className={styles.botIcon}><Bot size={18} /></div>
              <div className={styles.messageBubble}>역사 기록을 찾는 중입니다...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <div className={styles.suggestions}>
            {suggestions.map((s, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSendMessage(s)} 
                className={styles.suggestBtn}
                disabled={isLoading}
              >
                {s}
              </button>
            ))}
          </div>

          <form className={styles.inputForm} onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}>
            <input
              type="text"
              placeholder={isLoading ? "답변을 생성 중입니다..." : "궁금한 역사를 물어보세요..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={!inputText.trim() || isLoading} className={styles.sendBtn}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default History;