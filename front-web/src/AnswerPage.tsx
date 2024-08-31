import React from 'react';
import { useLocation } from 'react-router-dom';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import styles from './css/MainPage.module.css';

type AnswerData = {
  question_text: string;
  question_success_rate: number;
  answer_text: string;
  answer: string;
  student_answer: string;
};

const AnswerPage: React.FC = () => {
  const location = useLocation();
  const answerData: AnswerData[] = location.state?.answerData || [];

  const formatProblemText = (text: string) => {
    const latexRegex = /(\$.*?\$|\(.*?\))/g;
    const parts = text.split(latexRegex);
    return parts
      .map((part) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          return part;
        } else {
          return part.replace(/([①-⑳])/g, '\n$1 ');
        }
      })
      .join('');
  };

  return (
    <div className={styles.mainContent}>
      <MathJaxContext
        config={{
          tex: {
            inlineMath: [['$', '$']],
            processEscapes: true,
          },
          options: {
            processHtmlClass: 'tex2jax_process',
            ignoreHtmlClass: 'tex2jax_ignore',
          },
        }}
      >
        <div className={styles.competitionContainer}>
          <h2 className={styles.sectionTitle}>정답 및 해설</h2>
          {answerData.map((data, index) => (
            <div key={index} className={styles.problemSection}>
              <h3>문제 {index + 1}</h3>
              <div className={styles.questionBox}>
                <MathJax>{formatProblemText(data.question_text)}</MathJax>
                <p>정답률: {data.question_success_rate}%</p>
              </div>
              <div className={styles.answerBox}>
                <div className={styles.answerRow}>
                  <span className={styles.answerLabel}>정답:</span>
                  <MathJax className={styles.answerText}>{data.answer}</MathJax>
                  <span className={styles.answerLabel}>학생 답안:</span>
                  <span className={styles.studentAnswer}>
                    {data.student_answer}
                  </span>
                </div>
              </div>
              <div className={styles.explanationBox}>
                <h4>해설</h4>
                <MathJax>{formatProblemText(data.answer_text)}</MathJax>
              </div>
            </div>
          ))}
        </div>
      </MathJaxContext>
    </div>
  );
};

export default AnswerPage;
