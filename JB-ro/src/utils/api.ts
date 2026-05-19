import axios from 'axios';

// 1. 백엔드(Spring Boot)용 axios 인스턴스
const api = axios.create({
  baseURL: 'http://localhost:8081',
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
 * 역사 챗봇 응답 함수
 * 이제 프론트에서 직접 AI를 부르지 않고, 백엔드(ChatController)에 모든 것을 맡깁니다.
 */
export const getGeminiResponse = async (userMessage: string) => {
  const trimmedMsg = userMessage.trim();

  // [프론트 차단] 질문이 숫자만 있거나 너무 짧으면 서버에 보내지도 않음
  const isOnlyNumbers = /^\d+$/.test(trimmedMsg);
  if (isOnlyNumbers || trimmedMsg.length < 2) {
    return "전라북도의 역사나 인물에 대해 구체적으로 질문해 주세요! (예: 전주 한옥마을의 유래 알려줘)";
  }

  try {
    // 백엔드의 /api/chat/save 엔드포인트 호출
    // 컨트롤러에서 AI 호출 -> (조건 맞으면) 저장 -> 답변 반환을 한 번에 처리함
    const response = await api.post('/api/chat/save', {
      question: trimmedMsg
    });

    // 백엔드에서 받아온 답변 반환
    return response.data.answer;

  } catch (error: any) {
    console.error("채팅 에러:", error.message);
    return "역사 기록을 조회하는 중에 문제가 발생했어요. 잠시 후 다시 시도해 주세요.";
  }
};

export default api;