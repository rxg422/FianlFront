import axios from 'axios';
import historyData from './jeonbuk_history_full.json';

// 1. 기존 백엔드용 api 인스턴스 (유지)
const api = axios.create({
  baseURL: 'http://localhost:8082',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 2. Tavily 검색 함수
 */
const searchTavily = async (query: string) => {
  const TAVILY_API_KEY = process.env.NEXT_PUBLIC_TAVILY_API_KEY; 
  try {
    const response = await axios.post("https://api.tavily.com/search", {
      api_key: TAVILY_API_KEY,
      query: `전라북도 역사 관광 정보: ${query}`,
      search_depth: "basic",
      max_results: 3,
    });
    return response.data.results.map((res: any) => res.content).join("\n\n");
  } catch (error) {
    console.error("Tavily 검색 실패:", error);
    return "";
  }
};

/**
 * 3. 메인 챗봇 함수 (가드레일 로직 추가 버전)
 */
export const getGeminiResponse = async (userMessage: string) => {
  const API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim(); 
  const model = "llama-3.3-70b-versatile"; 
  const url = "https://api.groq.com/openai/v1/chat/completions";

  // --- [가드레일 로직 시작] ---
  const trimmedMsg = userMessage.trim();
  
  // 가드레일 1: 숫자만 입력하거나 너무 짧은 무의미한 입력 차단
  const isOnlyNumbers = /^\d+$/.test(trimmedMsg);
  const isTooShort = trimmedMsg.length < 2;

  if (isOnlyNumbers || isTooShort) {
    return "죄송해요. 입력하신 단어만으로는 정보를 찾기 어려워요. 전라북도의 역사나 인물, 유적지에 대해 구체적으로 물어봐 주시겠어요?";
  }
  // --- [가드레일 로직 끝] ---

  // 지역 매칭 및 지식 추출
  const matchedRegion = historyData.find(item => userMessage.includes(item.region.substring(0, 2)));
  let localKnowledge = matchedRegion ? matchedRegion.details.map(d => `[${d.era}]: ${d.content}`).join("\n") : "";
  
  // 실시간 검색
  const searchResults = await searchTavily(userMessage);

  try {
    const response = await axios.post(
      url,
      {
        model: model,
        messages: [
          { 
            role: "system", 
            content: `당신은 전라북도 역사 전문가 '전북路'입니다. 

                      [대화 원칙 - 중요]:
                      1. 사용자의 질문이 전라북도의 역사, 인물, 유적, 문화와 관련이 없다면 답변을 거절하세요.
                      2. 관련 없는 질문에는 "저는 전라북도의 역사에 대해서만 안내해 드리는 인공지능 가이드예요. 궁금한 전북의 역사를 물어봐 주세요!"라고만 답하세요.
                      3. 관련이 있는 질문이라면 아래 [지식 참고]를 바탕으로 정성껏 답하세요.

                      [출력 규칙]:
                      1. 한자(漢字)를 절대 사용하지 마세요. (예: 建立 -> 건립, 刻 -> 새김)
                      2. 모든 답변은 100% 한글로만 작성하세요. 괄호 안에 한자를 넣는 것도 금지합니다.
                      3. 영문 단어도 사용하지 마세요.
                      4. '~해요'체를 사용하여 친절하게 설명하세요.

                      [지식 참고]:
                      로컬 데이터: ${localKnowledge}
                      실시간 검색: ${searchResults}` 
          },
          { role: "user", content: userMessage }
        ],
        temperature: 0, 
        max_tokens: 1024
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const botReply = response.data.choices[0].message.content;

    // 가드레일 2: AI가 억지로 답변을 지어낸 경우 한 번 더 필터링 (선택 사항)
    if (botReply.includes("경기전") && isOnlyNumbers) {
       return "죄송해요. 전라북도 역사와 관련된 질문을 입력해 주세요!";
    }

    return botReply;
  } catch (error: any) {
    console.error("그록 에러:", error.response?.data || error.message);
    return "역사 기록을 확인하는 중에 잠시 문제가 생겼어요. 다시 시도해 주세요.";
  }
};

export default api;