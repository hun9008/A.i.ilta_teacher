import React, { useState, useEffect } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import styles from './css/MainPage.module.css';
import { useNavigate } from 'react-router-dom';

type Problem = {
  question_text: string;
  question_success_rate: number;
  q_id: string;
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
  const [c_id, setC_id] = useState<string>('');

  const u_id = localStorage.getItem('u_id');

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
    const term = parseInt(localStorage.getItem('term') || '1', 10);
    const difficulty = parseInt(localStorage.getItem('difficulty') || '1', 10);

    try {
      let url = import.meta.env.VITE_BASE_URL;
      if (contestType === 'last') {
        url += '/get_past_competition';
      } else {
        url += '/get_latest_competition';
      }

      const response = await fetch(url, {
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
      setC_id(data.c_id);
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

  const submitAnswers = async () => {
    const answerDataForNavigation = problems.map((problem, index) => ({
      question_text: problem.question_text,
      question_success_rate: problem.question_success_rate,
      answer_text: correctAnswers[index].answer_text,
      answer: correctAnswers[index].answer,
      student_answer: answers[index],
    }));

    if (contestType === 'now') {
      const url = `${import.meta.env.VITE_BASE_URL}/submit_competition`;
      const answerData = {
        c_id: c_id,
        u_id: u_id,
        answers: problems.map((problem, index) => ({
          q_id: problem.q_id,
          user_answer: answers[index],
        })),
      };
      console.log(answerData);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(answerData),
        });
        const result = await response.json();
        console.log('Submit result:', result);
      } catch (error) {
        console.error('Error submitting answers:', error);
      }
    }
    navigate('/main/competition/answer-page', {
      state: { answerData: answerDataForNavigation },
    });
  };

  const formatProblemText = (text: string) => {
    const parts = text.split(/(\$.*?\$)/);
    return parts
      .map((part, index) => {
        if (index % 2 === 1) {
          // LaTeX 부분
          return part
            .replace(/\\degree/g, '{\\degree}')
            .replace(/\\square/g, '{\\square}');
        } else {
          // 일반 텍스트 부분
          return part
            .replace(/\\degree/g, '°')
            .replace(/\\square/g, '²')
            .replace(/\^2(?![0-9])/g, '<sup>2</sup>')
            .replace(/tan⁡/g, 'tan');
        }
      })
      .join('');
  };

  const renderProblem = (problemText: string) => {
    const parts = problemText.split(/(<table[\s\S]*?<\/table>)/);
    return parts.map((part, index) => {
      if (part.startsWith('<table')) {
        // table은 dangerouslySetInnerHTML을 사용하여 직접 렌더링
        return (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: part }}
            className={styles.tableContainer}
          />
        );
      } else {
        // 나머지 텍스트는 MathJax로 처리
        const formattedText = formatProblemText(part);
        return (
          <MathJax key={index}>
            <span dangerouslySetInnerHTML={{ __html: formattedText }} />
          </MathJax>
        );
      }
    });
  };

  return (
    <div className={styles.mainContent}>
      <MathJaxContext
        config={{
          tex: {
            inlineMath: [['$', '$']],
            displayMath: [['$$', '$$']],
            processEscapes: true,
          },
          options: {
            skipHtmlTags: [
              'script',
              'noscript',
              'style',
              'textarea',
              'pre',
              'code',
            ],
          },
          loader: { load: ['[tex]/html'] },
          html: { mathml: true },
        }}
      >
        <div className={styles.competitionContainer}>
          <h2 className="text-2xl text-bold">문제집</h2>
          {problems.map((problem, index) => (
            <div key={index} className={styles.problemSection}>
              <h3>문제 {index + 1}</h3>
              <div className={styles.problemText}>
                {renderProblem(problem.question_text)}
              </div>
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
                className={`px-6 py-3 text-white font-semibold rounded-lg transition-all duration-300 ease-in-out ${
                  isSubmitEnabled
                    ? 'bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300'
                    : 'bg-gray-400 cursor-not-allowed'
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
