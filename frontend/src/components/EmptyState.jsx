import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

/* ──── Animations ──── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const floatA = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-8deg); }
  50%       { transform: translateY(-10px) rotate(-8deg); }
`;
const floatB = keyframes`
  0%, 100% { transform: translateY(0px) rotate(10deg); }
  50%       { transform: translateY(-14px) rotate(10deg); }
`;
const floatC = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-5deg); }
  50%       { transform: translateY(-8px) rotate(-5deg); }
`;
const floatD = keyframes`
  0%, 100% { transform: translateY(0px) rotate(12deg); }
  50%       { transform: translateY(-12px) rotate(12deg); }
`;
const floatE = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-15deg); }
  50%       { transform: translateY(-9px) rotate(-15deg); }
`;

/* ──── Styled Components ──── */
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 4rem 2rem;
  animation: ${fadeUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
`;

const Scene = styled.div`
  position: relative;
  width: 180px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* Floating ghost icon */
const GhostIcon = styled.div`
  position: absolute;
  width: 38px;
  height: 38px;
  background: #fff;
  border: 1.5px solid var(--clr-border, #dddde8);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 14px rgba(91, 110, 245, 0.08);
  color: var(--clr-text-muted, #9999b3);

  &:nth-child(1) { top: 0;    left: 10px;  animation: ${floatA} 3.2s ease-in-out infinite; animation-delay: 0s;    }
  &:nth-child(2) { top: 4px;  right: 5px;  animation: ${floatB} 3.8s ease-in-out infinite; animation-delay: 0.5s;  }
  &:nth-child(3) { top: 52px; left: 0;     animation: ${floatC} 3.5s ease-in-out infinite; animation-delay: 0.9s;  }
  &:nth-child(4) { top: 52px; right: 0;    animation: ${floatD} 4.1s ease-in-out infinite; animation-delay: 0.3s;  }
  &:nth-child(5) { bottom: 0; left: 26px;  animation: ${floatE} 3.6s ease-in-out infinite; animation-delay: 0.7s;  }
`;

/* Central main icon */
const CenterIcon = styled.div`
  width: 68px;
  height: 68px;
  background: #fff;
  border: 2px solid var(--clr-border, #dddde8);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  box-shadow: 0 8px 28px rgba(91, 110, 245, 0.10);
  position: relative;
  z-index: 2;
`;

const TextBlock = styled.div`
  text-align: center;
  max-width: 320px;
`;

const Title = styled.h3`
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--clr-text-heading, #0a0a12);
  letter-spacing: -0.025em;
  margin: 0 0 6px;
`;

const Subtitle = styled.p`
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.875rem;
  color: var(--clr-text-muted, #9999b3);
  margin: 0;
  line-height: 1.55;
`;

const ActionBtn = styled.button`
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  border-radius: 999px;
  border: 1.5px solid var(--clr-accent, #5b6ef5);
  background: transparent;
  color: var(--clr-accent, #5b6ef5);
  font-family: 'DM Sans', system-ui, sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: var(--clr-accent, #5b6ef5);
    color: #fff;
  }
`;

/* ──── Page-specific configs ──── */
const CONFIGS = {
  events: {
    center: '📅',
    ghosts: ['🗂️', '📌', '🏷️', '⏰', '🔔'],
    title: 'No events yet',
    subtitle: 'Create your first event to get started.',
  },
  'events-search': {
    center: '🔍',
    ghosts: ['📅', '📌', '🏷️', '🗂️', '🔎'],
    title: 'No events match your search',
    subtitle: 'Try a different keyword or clear the filter.',
  },
  users: {
    center: '👤',
    ghosts: ['📋', '🏷️', '📧', '🔑', '👥'],
    title: 'No users found',
    subtitle: 'No accounts match the current filter criteria.',
  },
  documents: {
    center: '📄',
    ghosts: ['📎', '🗂️', '✅', '📤', '📋'],
    title: 'No documents here',
    subtitle: 'Uploaded files and approval submissions will appear here.',
  },
  'documents-approvals': {
    center: '✅',
    ghosts: ['📄', '📎', '🗂️', '📋', '🔍'],
    title: 'No pending approvals',
    subtitle: 'All documents have been reviewed — nothing left to approve.',
  },
  'documents-mine': {
    center: '📤',
    ghosts: ['📄', '📎', '🗂️', '📁', '✍️'],
    title: "You haven't uploaded anything yet",
    subtitle: 'Upload your first document using the button above.',
  },
  participants: {
    center: '👥',
    ghosts: ['🏷️', '📋', '🆔', '📌', '🎫'],
    title: 'No registrations yet',
    subtitle: 'Teams that register for this event will appear here.',
  },
  shortlisted: {
    center: '⭐',
    ghosts: ['🏆', '📋', '🎯', '✅', '🥇'],
    title: 'No shortlisted teams yet',
    subtitle: 'Mark teams as shortlisted to track your top picks here.',
  },
  'participants-search': {
    center: '🔍',
    ghosts: ['👥', '🏷️', '📋', '🆔', '📌'],
    title: 'No results for your search',
    subtitle: 'Try a different name, team, or roll number.',
  },
  evaluators: {
    center: '🧑‍⚖️',
    ghosts: ['📋', '🔑', '📧', '🏷️', '🎯'],
    title: 'No evaluators assigned',
    subtitle: 'Add jury evaluators using the button above.',
  },
  feedback: {
    center: '💬',
    ghosts: ['⭐', '📝', '💭', '📊', '🗣️'],
    title: 'No feedback yet',
    subtitle: 'Feedback and ratings from participants will appear here.',
  },
  results: {
    center: '🏆',
    ghosts: ['🥇', '🥈', '🥉', '🎖️', '📊'],
    title: 'Results not published yet',
    subtitle: 'Check back after evaluation to see the winners.',
  },
  projects: {
    center: '📭',
    ghosts: ['💡', '📄', '🖥️', '📝', '🔬'],
    title: 'No project submissions yet',
    subtitle: 'Teams can submit projects once the submission window is open.',
  },
  teams: {
    center: '🤝',
    ghosts: ['👤', '👥', '🏷️', '📋', '🆔'],
    title: 'No teams found',
    subtitle: 'No team members match the search or filter criteria.',
  },
  logs: {
    center: '📜',
    ghosts: ['🔍', '⏱️', '🖊️', '📋', '🗂️'],
    title: 'No audit logs yet',
    subtitle: 'System activity and admin actions will be recorded here.',
  },
  default: {
    center: '📭',
    ghosts: ['📄', '🗂️', '🏷️', '🔍', '📋'],
    title: 'Nothing here yet',
    subtitle: 'This section is empty right now.',
  },
};

/* ──── Component ──── */
const EmptyState = ({
  variant = 'default',
  title,
  subtitle,
  action,
  onAction,
}) => {
  const cfg = useMemo(() => CONFIGS[variant] || CONFIGS.default, [variant]);

  const displayTitle    = title    ?? cfg.title;
  const displaySubtitle = subtitle ?? cfg.subtitle;

  return (
    <Wrapper>
      <Scene>
        {cfg.ghosts.map((g, i) => (
          <GhostIcon key={i}>{g}</GhostIcon>
        ))}
        <CenterIcon>{cfg.center}</CenterIcon>
      </Scene>

      <TextBlock>
        <Title>{displayTitle}</Title>
        <Subtitle>{displaySubtitle}</Subtitle>
      </TextBlock>

      {action && onAction && (
        <ActionBtn onClick={onAction}>
          {action}
        </ActionBtn>
      )}
    </Wrapper>
  );
};

export default EmptyState;
