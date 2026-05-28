import React from 'react';
import { CPDScenario } from '../../services/assessmentEngine';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

export interface ScenarioQuestionProps {
  question: CPDScenario;
  currentAnswer?: number; // selected answer score
  onAnswer: (score: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function ScenarioQuestion({ question, currentAnswer, onAnswer, questionNumber, totalQuestions }: ScenarioQuestionProps) {
  return (
    <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: DS.muted }}>Question {questionNumber} of {totalQuestions}</span>
      </div>

      <h3 style={{
        fontFamily: DS.headingFont,
        fontSize: '20px',
        color: DS.text,
        marginBottom: '24px',
        lineHeight: 1.5
      }}>
        {question.scenario}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {question.answers.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(option.score)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '18px 20px',
              background: currentAnswer === option.score ? `${DS.accent}20` : DS.card,
              border: `1px solid ${currentAnswer === option.score ? DS.accent : DS.border}`,
              borderRadius: DS.radius,
              color: DS.text,
              fontSize: '15px',
              fontWeight: currentAnswer === option.score ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '56px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '32px',
              height: '32px',
              background: currentAnswer === option.score ? DS.accent : DS.bg,
              color: '#000000',
              borderRadius: '50%',
              marginRight: '16px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {option.label}
            </div>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
