import React , { useState } from 'react';
import styles from './css/MainPage.module.css';
import { Button } from "./button"
import { FileText, Plus, X, Download } from "lucide-react"
import jsPDF from 'jspdf'
import 'jspdf-autotable';  // 테이블을 포함한 다양한 기능을 추가로 지원
import font from './font.txt'

type Report = {
  id: string;
  title: string;
  content: string;
  date: string;
};

const Report: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([
    { id: '1', title: '수학 학습 리포트', content: '수학 학습 내용입니다. 이번 주에는 미적분의 기초에 대해 학습했습니다. 극한과 연속성, 미분의 정의와 기본 법칙들을 다루었고, 다항함수의 미분을 연습했습니다. 특히 상품 가격 결정과 같은 실생활 문제에 미분을 적용하는 방법을 배웠습니다.', date: '2023-06-01' },
    { id: '2', title: '영어 학습 리포트', content: '영어 학습 내용입니다. 이번 주 영어 학습은 비즈니스 영어에 초점을 맞추었습니다. 이메일 작성법, 회의 진행 용어, 프레젠테이션 기술 등을 학습했습니다. 또한, 영어로 된 TED 강연을 듣고 요약하는 연습을 통해 청취 능력과 요약 능력을 향상시켰습니다.', date: '2023-06-02' },
    { id: '3', title: '과학 학습 리포트', content: '과학 학습 내용입니다. 이번 주에는 생태계와 환경에 대해 학습했습니다. 기후 변화가 생태계에 미치는 영향, 생물 다양성의 중요성, 지속 가능한 발전 등의 주제를 다루었습니다. 특히 지역 하천의 수질 오염 문제를 조사하고 개선 방안을 제시하는 프로젝트를 수행했습니다.', date: '2023-06-03' },
    { id: '4', title: 'eng study report', content: 'It is the report for english. You are doing good', date: '2023-06-03' },
  ]);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const createNewReport = () => {
    const newReport: Report = {
      id: Date.now().toString(),
      title: `새 학습 리포트 ${reports.length + 1}`,
      content: '새로 생성된 리포트 내용입니다. 이 부분은 실제 학습 데이터와 ChatGPT API를 통해 자동으로 생성될 예정입니다.',
      date: new Date().toISOString().split('T')[0],
    };

    setReports([newReport, ...reports]);
  };

  const savePDF = (report: Report) => {
    console.log(`Saving report as PDF: ${report.title}`);
    const doc = new jsPDF({
      orientation: "p", // p: 가로(기본), l: 세로
        unit: "mm", // 단위 : "pt" (points), "mm", "cm", "m", "in" or "px" 등)
        format: "a4", // 포맷 (페이지 크기).
    });

    // // 외부 글꼴 사용 예제
    // doc.addFileToVFS('NotoSansKR-Regular.ttf', font);
    // doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
    // doc.setFont('NotoSansKR');
    console.log("font list: ", doc.getFontList());

    doc.setFontSize(18);
    doc.text(report.title, 10, 20);

    doc.setFontSize(12);
    doc.text(`Date: ${report.date}`, 10, 30);

    // 줄바꿈을 지원하는 text 메서드 호출
    const splitText = doc.splitTextToSize(report.content, 180); // 180은 페이지 너비에서 마진을 제외한 텍스트 최대 너비
    doc.text(splitText, 10, 40);

    doc.save(`${report.title}.pdf`);
  };

  return (
    <div className = {styles.reportContent}>
      <div className={styles.reportContainer}>
        {/* <h1>File Text Page</h1> */}

        <Button 
          onClick={createNewReport}
          className={styles.createReportButton}
        >
          <Plus className="mr-2 h-4 w-4" /> 리포트 만들기
        </Button>

        <div className={styles.reportContainer}>
          {reports.map((report, index) => {
            const angle = (index - (reports.length - 1) / 2) * 15;
            // const radius = 300; // Radius of the semicircle
            const radiusX = 400; // X축 방향의 반지름 (가로로 더 길게 설정)
            const radiusY = 200; // Y축 방향의 반지름 (세로로 더 짧게 설정)
            const x = radiusX * Math.sin(angle * Math.PI / 180);
            const y = radiusY * Math.cos(angle * Math.PI / 180);
            
            return (
              <div
                key={report.id}
                className={styles.reportCard}
                style={{
                  transform: `translate(calc(-50% + ${x}px), ${-Math.abs(y)}px)`, // y 값을 항상 음수로 하여 위쪽에만 위치시킴
                  zIndex: reports.length - index,
                }}
                onClick={() => setSelectedReport(report)}
              >
                <div className="bg-white rounded-lg shadow-md p-4 w-40 h-60 flex flex-col justify-between transform hover:scale-105 transition duration-300">
                  <div>
                    <h3 className="font-bold text-sm mb-2 truncate">{report.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-3">{report.content}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">{report.date}</span>
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}ㄴ
        </div>

        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedReport.title}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <p className="text-gray-600 mb-4">{selectedReport.content}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{selectedReport.date}</span>
                <Button onClick={() => savePDF(selectedReport)} className="bg-green-500 hover:bg-green-600">
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

