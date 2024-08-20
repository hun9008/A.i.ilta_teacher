import React, { useState, useEffect } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import styles from './css/MainPage.module.css';
import { useNavigate } from 'react-router-dom';

type Problem = {
  question_text: string;
  question_success_rate: number;
};

type Answer = {
  answer_text: string;
  answer: string;
};

const ProblemSetGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<Answer[]>([]);
  const contestType = localStorage.getItem('contestType');

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    const allAnswered =
      problems.length > 0 &&
      problems.every(
        (_, index) => answers[index] && answers[index].trim() !== ''
      );
    setIsSubmitEnabled(allAnswered);
  }, [answers, problems]);

  const fetchProblems = async () => {
    // const contestType = localStorage.getItem('contestType');
    const term = parseInt(localStorage.getItem('term') || '1', 10);
    const difficulty = parseInt(localStorage.getItem('difficulty') || '1', 10);

    try {
      // let url = import.meta.env.VITE_COMPETITION_URL;
      // if (contestType === 'last') {
      //   url += '/past'; // 지난 대회용 엔드포인트
      // }

      const response = await fetch(import.meta.env.VITE_COMPETITION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ term, difficulty }),
      });
      const data = await response.json();
      console.log(data);

      setProblems(data.problem_set);
      setCorrectAnswers(data.answer_set);
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [index]: value,
    }));
  };

  const submitAnswers = () => {
    if (contestType === 'last') {
      const answerData = problems.map((problem, index) => ({
        question_text: problem.question_text,
        question_success_rate: problem.question_success_rate,
        answer_text: correctAnswers[index].answer_text,
        answer: correctAnswers[index].answer,
        student_answer: answers[index],
      }));
      navigate('/main/competition/answer-page', { state: { answerData } });
    } else {
      console.log('Submitted answers:', answers);
      // Here you can add logic for submitting answers for current contests
    }
  };
  const formatProblemText = (text: string) => {
    // LaTeX 구문을 식별하기 위한 정규 표현식 개선
    const latexRegex = /(\$.*?\$|\(.*?\))/g;

    const parts = text.split(latexRegex);
    return parts
      .map((part) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          // 달러 기호로 둘러싸인 LaTeX 수식
          return part;
        } else {
          // 일반 텍스트 부분 (한글 포함)
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
            inlineMath: [
              ['$', '$'],
              ['\\', '\\'],
            ],
            processEscapes: true,
          },
          options: {
            processHtmlClass: 'tex2jax_process',
            ignoreHtmlClass: 'tex2jax_ignore',
          },
        }}
      >
        <div className={styles.competitionContainer}>
          <h2 className={styles.sectionTitle}>문제집</h2>
          {problems.map((problem, index) => (
            <div key={index} className={styles.problemSection}>
              <h3>문제 {index + 1}</h3>
              <MathJax>{formatProblemText(problem.question_text)}</MathJax>
              <div className={styles.answerSection}>
                <label htmlFor={`answer-${index}`}>정답 : </label>
                <input
                  id={`answer-${index}`}
                  type="text"
                  placeholder="정답을 입력하세요"
                  value={answers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className={styles.answerInput}
                />
              </div>
            </div>
          ))}
          {problems.length > 0 && (
            <div className={styles.submitContainer}>
              <button
                onClick={submitAnswers}
                disabled={!isSubmitEnabled}
                className={`${styles.submitButton} ${
                  isSubmitEnabled ? styles.enabled : styles.disabled
                }`}
              >
                제출하기
              </button>
            </div>
          )}
        </div>
      </MathJaxContext>
    </div>
  );
};

export default ProblemSetGenerator;
