import React, { useState } from 'react';
import styles from './css/MainPage.module.css';
import { Button } from "./button"
import { FileText, Plus, X, Download, Loader } from "lucide-react"
import jsPDF from 'jspdf'
import 'jspdf-autotable';  // 테이블을 포함한 다양한 기능을 추가로 지원
import font from './font.txt'

import { OpenAI } from 'openai';
const apiKey = process.env.VITE_OPENAI_API_KEY;

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
    { id: '1', title: 'Study Report ex 3', content: 'This week, we focused on the basics of calculus in our math study. We covered topics such as limits, continuity, the definition of derivatives, and basic differentiation rules. We also practiced differentiating polynomial functions and applied derivatives to real-life problems, such as determining product pricing.', date: '2023-06-01' },
    { id: '2', title: 'Study Report ex 2', content: 'This week’s English study focused on business English. We learned about email writing, meeting terminology, and presentation skills. Additionally, we practiced summarizing by listening to TED talks in English, which helped improve our listening and summarization abilities.', date: '2023-06-02' },
    { id: '3', title: 'Study Report ex 1', content: 'This week’s science study was about ecosystems and the environment. We studied the impact of climate change on ecosystems, the importance of biodiversity, and sustainable development. We also conducted a project investigating the water pollution problem in a local river and proposed improvement measures.', date: '2023-06-03' },
  ]);

  const [loading, setLoading] = useState(false); // Add loading state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const createNewReport = async () => {
    setLoading(true); // Start loading

    const weekly_reports = localStorage.getItem('weekly_reports');
    const z_log = localStorage.getItem('z_log');
    const progress_unit = localStorage.getItem('progress_unit');
    const not_focusing_list = localStorage.getItem('not_focusing_list');

    const prompt = `
      Here is the weekly study report data:
      1. Weekly Reports: ${weekly_reports}
      2. Z Log: ${z_log}
      3. Progress Unit: ${progress_unit}
      4. Not Focusing List: ${not_focusing_list}

      Please summarize the student's performance, highlight key achievements, and identify areas that need improvement. Structure the report in a narrative format.
    `;

    try {
      const response = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const messageContent = response.choices[0].message?.content?.trim() || 'Report generation failed.';

      const newReport: Report = {
        id: Date.now().toString(),
        title: `Study Report ${reports.length + 1} ${new Date().toLocaleDateString('ko-KR', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
        }).replace(/ /g, '').replace(/\./g, '.')}`,
        content: messageContent,
        date: new Date().toISOString().split('T')[0],
      };

      setReports([newReport, ...reports]);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const savePDF = (report: Report) => {
    console.log(`Saving report as PDF: ${report.title}`);
    const doc = new jsPDF({
      orientation: "p", // p: 가로(기본), l: 세로
        unit: "mm", // 단위 : "pt" (points), "mm", "cm", "m", "in" or "px" 등)
        format: "a4", // 포맷 (페이지 크기).
    });

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
          <div className="flex justify-center items-center mt-8">
            <Loader className="animate-spin h-8 w-8 text-blue-500" />
            <span className="ml-4 text-blue-500">리포트 만드는 중...</span>
          </div>
        ) : (
          <div className={styles.reportContainer}>
            {reports.map((report, index) => {
              const angle = (index - (reports.length - 1) / 2) * 15;
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
            })}
          </div>
        )}

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
