import React, { useState } from 'react';
import styles from './css/MainPage.module.css';
import { Button } from './button';
import { FileText, Plus, X, Download, Loader } from 'lucide-react';
import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

import { OpenAI } from 'openai';
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const client = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});

type Report = {
  id: string;
  title: string;
  content: string;
  date: string;
};

const Report: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([
    // Example reports
    {
      id: '1',
      title: '수학 학습 보고서(예시)',
      content:
        '이번 주 우리는 수학 공부에서 미적분의 기초에 집중했습니다. 우리는 극한, 연속성, 미분의 정의 및 기본 미분 규칙과 같은 주제를 다루었습니다. 또한 다항식 함수의 미분 연습을 하고, 파생 상품 가격 결정과 같은 실제 문제에 미분을 적용했습니다.',
      date: '2023-06-01',
    },
    {
      id: '2',
      title: '수학 학습 보고서',
      content:
        '미적분의 기초에 집중했습니다. 극한, 연속성, 미분의 정의 및 기본 미분 규칙과 같은 주제를 다루었습니다. 또한 다항식 함수의 미분 연습을 하고, 파생 상품 가격 결정과 같은 실제 문제에 미분을 적용했습니다.',
      date: '2023-06-07',
    },
    {
      id: '3',
      title: '영어 학습 보고서(예시)',
      content:
        '이번 주의 영어 공부는 비즈니스 영어에 중점을 두었습니다. 이메일 작성, 회의 용어, 프레젠테이션 기술에 대해 배웠습니다. 또한 TED 강연을 듣고 요약하는 연습을 하여 듣기와 요약 능력을 향상시켰습니다.',
      date: '2023-06-02',
    },
    {
      id: '4',
      title: '과학 학습 보고서(예시)',
      content:
        '이번 주의 과학 공부는 생태계와 환경에 관한 것이었습니다. 우리는 기후 변화가 생태계에 미치는 영향, 생물 다양성의 중요성 및 지속 가능한 개발에 대해 공부했습니다. 또한 지역 하천의 수질 오염 문제를 조사하고 개선 방안을 제안하는 프로젝트를 수행했습니다.',
      date: '2023-06-03',
    },
  ]);

  const [loading, setLoading] = useState(false); // Add loading state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const createNewReport = async () => {
    setLoading(true); // Start loading

    const nickname = localStorage.getItem('nickname');
    const weekly_reports = localStorage.getItem('weekly_reports');
    const z_log = localStorage.getItem('z_log');
    const progress_unit = localStorage.getItem('progress_unit');
    const not_focusing_list = localStorage.getItem('not_focusing_list');

    const prompt = `
      주간 학습 보고서 데이터는 다음과 같습니다:
      0. 학생 이름: ${nickname}
      1. 주간 보고서: ${weekly_reports}
      2. Z 로그: ${z_log}
      3. 진행 단위: ${progress_unit}
      4. 집중하지 않는 목록: ${not_focusing_list}

      학생의 성과를 요약하고, 주요 성취 사항을 강조하며, 개선이 필요한 영역을 식별해줘. 보고서는 서술 형식으로 작성해줘. 반드시 한글로 작성해줘.
    `;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '당신은 도움을 주는 어시스턴트입니다.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });
      console.log("gpt result: ", response)
      const messageContent =
        response.choices[0].message?.content?.trim() ||
        '보고서 생성에 실패했습니다.';

      const newReport: Report = {
        id: Date.now().toString(),
        title: `학습 보고서 ${reports.length + 1} ${new Date()
          .toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
          })
          .replace(/ /g, '')
          .replace(/\./g, '.')}`,
        content: messageContent,
        date: new Date().toISOString().split('T')[0],
      };

      setReports([newReport, ...reports]);
    } catch (error) {
      console.error('보고서 생성 오류:', error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const savePDF = async (report: Report) => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
  
    const fontUrl = '/NotoSansKR-Regular.ttf';
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
  
    const customFont = await pdfDoc.embedFont(fontBytes);
  
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 사이즈
    const { width, height } = page.getSize();
    
    const fontSize = 18;
    const margin = 50;
    const maxWidth = width - 4 * margin;
    const lineHeight = fontSize + 8; // 줄 간격 조정
  
    // 타이틀 추가
    page.drawText(report.title, {
      x: margin,
      y: height - 4 * fontSize,
      size: fontSize,
      font: customFont,
      color: rgb(0, 0, 0),
    });
  
    // 날짜 추가
    page.drawText(`날짜: ${report.date}`, {
      x: margin,
      y: height - 6 * fontSize,
      size: 12,
      font: customFont,
      color: rgb(0, 0, 0),
    });
  
    // 본문 텍스트 추가
    const contentFontSize = 12;
    const contentLineHeight = contentFontSize + 6; // 본문 텍스트의 줄 간격
  
    // 입력 텍스트를 줄 단위로 분리하여 줄바꿈 적용
    const lines = report.content.split('\n').flatMap(line => 
      splitTextToLines(line, maxWidth, customFont, contentFontSize)
    );
  
    let yOffset = height - 8 * fontSize - lineHeight; // 타이틀과 날짜 사이 간격
    lines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y: yOffset,
        size: contentFontSize,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      yOffset -= contentLineHeight; // 줄 간격을 포함하여 yOffset 조정
    });
  
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}.pdf`;
    a.click();
  };
  
  // 텍스트를 줄바꿈하여 페이지 너비에 맞추는 함수
  function splitTextToLines(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
  
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testLineWidth < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
  
    if (currentLine) {
      lines.push(currentLine);
    }
  
    return lines;
  }
  

  return (
    <div className={styles.reportContent}>
      <div className={styles.reportContainer}>
        <Button
          onClick={createNewReport}
          className={styles.createReportButton}
          disabled={loading} // Disable button while loading
        >
          {loading ? (
            <Loader className="animate-spin mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {loading ? '리포트 만드는 중...' : '리포트 만들기'}
        </Button>

        {loading ? (
        <div className={styles.loadingMessage}>
          <Loader className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-4 text-blue-500">리포트를 만드는 중...</span>
        </div>
        ) : (
          <div className={styles.reportContainer}>
            {reports.map((report, index) => {
              const angle = (index - (reports.length - 1) / 2) * 15;
              const radiusX = 400; // X축 방향의 반지름 (가로로 더 길게 설정)
              const radiusY = 200; // Y축 방향의 반지름 (세로로 더 짧게 설정)
              const x = radiusX * Math.sin((angle * Math.PI) / 180);
              const y = radiusY * Math.cos((angle * Math.PI) / 180);

              return (
                <div
                  key={report.id}
                  className={styles.reportCard}
                  style={{
                    transform: `translate(calc(-50% + ${x}px), ${-Math.abs(
                      y
                    )}px)`, // y 값을 항상 음수로 하여 위쪽에만 위치시킴
                    zIndex: reports.length - index,
                  }}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="bg-white rounded-lg shadow-md p-4 w-40 h-60 flex flex-col justify-between transform hover:scale-105 transition duration-300">
                    <div>
                      <h3
                        className="font-bold text-sm mb-2 truncate"
                        style={{ backgroundColor: '#E6E6FA', padding: '1px', borderRadius: '1px' }} // 연보라색 배경 추가
                      >
                        {report.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-3">
                        {report.content}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {report.date}
                      </span>
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedReport.title}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedReport(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <p className="text-gray-600 mb-4">{selectedReport.content}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {selectedReport.date}
                </span>
                <Button
                  onClick={() => savePDF(selectedReport)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Download className="mr-2 h-4 w-4" /> PDF 저장
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
