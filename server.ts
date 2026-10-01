import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Shared Gemini AI client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to call Gemini with retry and fallback for transient 503 / 429
async function callGeminiWithRetry(params: any): Promise<any> {
  const modelsToTry = [params.model || 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await ai.models.generateContent({
          ...params,
          model: modelName,
        });
      } catch (err: any) {
        lastError = err;
        const isTransient =
          err?.message?.includes('503') ||
          err?.message?.includes('high demand') ||
          err?.message?.includes('UNAVAILABLE') ||
          err?.message?.includes('429');
        if (isTransient) {
          console.warn(`Model ${modelName} attempt ${attempt} failed with transient error: ${err.message}. Retrying or cascading...`);
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
        } else {
          throw err;
        }
      }
    }
  }

  throw lastError;
}

// Helper to clean JSON string from markdown code blocks
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * 1. 정성 분석 (서술형 응답 + 인터뷰 메모 + 참고자료 분류)
 */
app.post('/api/ai/qualitative-analysis', async (req, res) => {
  try {
    const { projectContext, surveyComments, interviewMemos, referenceDocs } = req.body;

    const prompt = `
당신은 기업 HRD 교육요구분석 최고 전문가입니다.
제공된 교육 프로젝트 정보와 정성 데이터(설문 서술형 응답, 인터뷰/FGI 메모, 참고자료)를 분석하여 핵심 주제(Topic)별로 체계적으로 분류하고 니즈를 정리해주세요.

[프로젝트 개요]
- 과정명: ${projectContext?.title || '미정'}
- 대상 직무/직급: ${projectContext?.targetRole || '미정'} / ${projectContext?.targetLevel || '미정'}
- 교육 배경: ${projectContext?.background || '미정'}
- 기대 성과: ${projectContext?.expectedOutcome || '미정'}

[수집된 정성 데이터]
1. 설문 서술형 응답:
${surveyComments && surveyComments.length > 0 ? surveyComments.map((c: string, idx: number) => `(${idx + 1}) ${c}`).join('\n') : '(없음)'}

2. 인터뷰 및 FGI 메모:
${interviewMemos && interviewMemos.length > 0 ? interviewMemos.map((m: any, idx: number) => `[출처: ${m.sourceRole || '참여자'}] (일자: ${m.date || ''}) ${m.content}`).join('\n') : '(없음)'}

3. 참고 자료(직무기술서/조직현황 등):
${referenceDocs && referenceDocs.length > 0 ? referenceDocs.map((d: any, idx: number) => `[자료명: ${d.title}] ${d.content}`).join('\n') : '(없음)'}

[분석 지침]
1. 입력 데이터에 명시된 내용을 바탕으로 3~6개의 핵심 주제(Topic)로 그룹화하세요.
2. 절대로 없는 사실이나 거짓된 내용을 지어내지 마세요.
3. 대표 발언(representativeQuotes)은 제공된 설문 서술형 응답 또는 인터뷰 메모 원문에서 가능한 한 원형을 그대로 인용하세요.
4. 언급 대상자 유형(targetRoles)은 발언한 주체(예: 신임 팀장, 사업부장/경영진, 팀원, 인사담당자 등)를 구체적으로 명시하세요.
5. 언급 빈도(frequency)는 수집된 데이터 내에서 해당 주제와 관련된 발언이나 의견의 대략적인 수량(건수)을 숫자로 기재하세요.
6. 응답은 반드시 지정된 JSON 포맷으로만 반환하세요.
`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  topicName: { type: Type.STRING, description: '주제명 (예: 팀원 면담 및 코칭 스킬 부족)' },
                  needSummary: { type: Type.STRING, description: '니즈 핵심 요약 (1~2문장)' },
                  frequency: { type: Type.INTEGER, description: '관련 언급 건수' },
                  representativeQuotes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '원문에서 그대로 인용한 대표 발언 2~3개',
                  },
                  targetRoles: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '언급한 대상자 유형 목록',
                  },
                  urgencyScore: { type: Type.NUMBER, description: '시급성 추정치 (1.0 ~ 5.0)' },
                  importanceScore: { type: Type.NUMBER, description: '중요도 추정치 (1.0 ~ 5.0)' },
                },
                required: ['topicName', 'needSummary', 'frequency', 'representativeQuotes', 'targetRoles'],
              },
            },
          },
          required: ['topics'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonResponse(response.text || '{}'));
    // Ensure unique IDs
    const topics = (parsed.topics || []).map((t: any, idx: number) => ({
      ...t,
      id: t.id || `topic-${Date.now()}-${idx}`,
      urgencyScore: t.urgencyScore || 4.0,
      importanceScore: t.importanceScore || 4.2,
    }));

    res.json({ success: true, topics });
  } catch (error: any) {
    console.error('Qualitative analysis error:', error);
    res.status(500).json({ success: false, error: error.message || '정성 분석 처리 중 오류가 발생했습니다.' });
  }
});

/**
 * 2. 니즈별 교육 / 비교육 분류 AI 제안
 */
app.post('/api/ai/classify-needs', async (req, res) => {
  try {
    const { projectContext, needs } = req.body;

    const prompt = `
당신은 HRD 성능공학(HPT) 및 Mager & Pipe 원인분석 모델 전문가입니다.
다음 교육요구분석 니즈 목록을 검토하고, 각 니즈가 '교육으로 해결(Training)'해야 할 과제인지, '비교육적 해결(제도·환경·도구 등 Non-training)' 과제인지, 아니면 '보류(On Hold)'해야 할 과제인지 제안해주세요.

[프로젝트 개요]
- 과정명: ${projectContext?.title || '미정'}
- 대상: ${projectContext?.targetRole || '미정'} (${projectContext?.targetLevel || '미정'})

[니즈 목록]
${JSON.stringify(needs, null, 2)}

[분석 기준]
- "교육으로 해결": 지식(Knowledge), 기술(Skill), 태도(Attitude), 마인드셋, 행동양식 부족으로 발생하며 학습과 실습을 통해 역량을 신장할 수 있는 경우.
- "비교육적 해결": 평가/보상 제도, 인력 리소스 부족, R&R 불명확, 시스템 및 업무 툴 부재, 사내 문화 등 제도/환경적 개선이 우선되어야 하는 경우.
- "보류": 현재 시점에서 명확한 사실 확인이 추가로 필요하거나 우선순위가 매우 낮은 경우.

[반환 지침]
각 니즈의 id와 제안 분류(category: "training" | "non-training" | "hold"), 그리고 현업 관리자와 HRD 담당자가 납득할 수 있는 명확한 '근거(rationale)'를 1~2문장으로 작성해주세요.
`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    description: "'training' (교육으로 해결), 'non-training' (비교육적 해결), 'hold' (보류)",
                  },
                  rationale: { type: Type.STRING, description: '분류 근거 한 줄' },
                },
                required: ['id', 'category', 'rationale'],
              },
            },
          },
          required: ['classifications'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonResponse(response.text || '{}'));
    res.json({ success: true, classifications: parsed.classifications || [] });
  } catch (error: any) {
    console.error('Classify needs error:', error);
    res.status(500).json({ success: false, error: error.message || '니즈 분류 중 오류가 발생했습니다.' });
  }
});

/**
 * 3. 결과서 초안 생성
 */
app.post('/api/ai/generate-report', async (req, res) => {
  try {
    const { projectContext, surveyStats, quantitativeSummary, qualitativeTopics, priorityNeeds } = req.body;

    const prompt = `
당신은 국내 대기업 및 글로벌 기업의 전략적 HRD 교육체계 설계 수석 컨설턴트입니다.
아래의 교육요구분석 데이터를 바탕으로 완성도 높고 전문적인 "교육요구분석 결과보고서" 초안을 작성해주세요.
모든 섹션은 기업 경영진과 HR 부서장이 즉시 검토하고 의사결정할 수 있는 격조 있고 실무적인 한국어 비즈니스 문체(개조식 및 서술식 혼용)로 기술해주세요.

[프로젝트 기본 정보]
- 과정명: ${projectContext?.title}
- 요청 부서: ${projectContext?.requestDepartment}
- 대상 직무/직급: ${projectContext?.targetRole} / ${projectContext?.targetLevel}
- 예상 인원: ${projectContext?.targetCount}명
- 교육 요청 배경: ${projectContext?.background}
- 기대 성과: ${projectContext?.expectedOutcome}
- 추진 일정: ${projectContext?.startDate} ~ ${projectContext?.endDate}

[데이터 수집 현황]
- 설문 응답자 수: ${surveyStats?.respondentCount || 0}명
- 인터뷰/FGI 건수: ${surveyStats?.interviewCount || 0}건
- 참고 자료 건수: ${surveyStats?.referenceCount || 0}건

[정량 갭 분석 및 Borich 요구도 상위 결과]
${JSON.stringify(quantitativeSummary || [], null, 2)}

[정성 분석 주요 주제 및 발언]
${JSON.stringify(qualitativeTopics || [], null, 2)}

[우선순위 및 해결 방향 판정 결과]
${JSON.stringify(priorityNeeds || [], null, 2)}

[결과보고서 필수 목차 구성]
1. 요구분석 개요: 배경, 목적, 대상, 분석 방법론, 추진 경과
2. 데이터 수집 현황: 출처별 표본 구성 및 분석 프레임워크
3. 정량 분석 결과: 역량별 현재/기대 수준 갭 분석, Borich 요구도 산출 및 최상위 과제 해석
4. 정성 분석 결과: 심층 인터뷰 및 서술형 응답 핵심 테마, 현장 목소리(원문 인용 포함)
5. 우선순위 및 해결 방향: 2x2 매트릭스 도출 결과, 교육적 해결 과제 vs 비교육적 조직/제도 개선 과제 분리 제안
6. 교육과정 설계 시사점: 핵심 학습 목표, 필수 권장 모듈 및 내용, 최적 교수학습 방식(워크숍, 롤플레잉, 코칭 등), 전이(Transfer) 지원 방안

각 섹션별로 충실하고 구체적인 문장과 항목들로 작성하세요. 원문 발언이 있을 경우 생생하게 살려주세요.
`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            executiveSummary: { type: Type.STRING, description: '보고서 핵심 요약 (3~5줄)' },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  number: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING, description: '섹션 본문 내용 (마크다운 포맷 지원)' },
                  keyTakeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '섹션 핵심 시사점 요약 포인트 2~3개',
                  },
                },
                required: ['id', 'number', 'title', 'content'],
              },
            },
          },
          required: ['title', 'executiveSummary', 'sections'],
        },
      },
    });

    const parsed = JSON.parse(cleanJsonResponse(response.text || '{}'));
    res.json({ success: true, report: parsed });
  } catch (error: any) {
    console.error('Generate report error:', error);
    res.status(500).json({ success: false, error: error.message || '보고서 초안 생성 중 오류가 발생했습니다.' });
  }
});

// Vite middleware or static serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`HRD Needs Analysis server running on port ${port}`);
});
