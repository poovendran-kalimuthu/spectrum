import React, { useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';

/* ─────────────────────────────────────────────
   Context-aware word sets derived from text prop
───────────────────────────────────────────── */
const WORD_SETS = {
  event:       ['events',       'schedules',    'rounds',     'timelines',  'details'    ],
  user:        ['users',        'profiles',     'roles',      'accounts',   'members'    ],
  audit:       ['logs',         'records',      'history',    'actions',    'trails'     ],
  document:    ['documents',    'files',        'uploads',    'approvals',  'proofs'     ],
  participant: ['participants', 'teams',        'entries',    'members',    'data'       ],
  feedback:    ['feedback',     'insights',     'reviews',    'ratings',    'comments'   ],
  profile:     ['profile',      'details',      'settings',   'info',       'data'       ],
  portal:      ['portal',       'assignments',  'evaluations','scores',     'criteria'   ],
  result:      ['results',      'winners',      'rankings',   'scores',     'leaderboard'],
  project:     ['projects',     'submissions',  'abstracts',  'reports',    'files'      ],
  jury:        ['jury',         'assignments',  'evaluators', 'panels',     'scores'     ],
  google:      ['credentials',  'session',      'auth',       'tokens',     'access'     ],
  default:     ['data',         'content',      'resources',  'assets',     'info'       ],
};

function deriveWords(text = '') {
  const lower = text.toLowerCase();
  for (const [key, words] of Object.entries(WORD_SETS)) {
    if (lower.includes(key)) return words;
  }
  return WORD_SETS.default;
}

function deriveLabel(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('saving') || lower.includes('submitting')) return 'saving';
  if (lower.includes('processing'))  return 'processing';
  if (lower.includes('redirect'))    return 'redirecting';
  if (lower.includes('waking')  || lower.includes('starting')) return 'starting';
  if (lower.includes('preparing'))   return 'preparing';
  if (lower.includes('fetching'))    return 'fetching';
  return 'loading';
}

/* ──── Keyframes ──── */
const triSpin = keyframes`
  100% { transform: rotate(1turn); }
`;

const cycleWords = keyframes`
  0%   { transform: translateY(0%);    animation-timing-function: linear; }
  16%  { transform: translateY(0%);    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  20%  { transform: translateY(-100%); animation-timing-function: linear; }
  36%  { transform: translateY(-100%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  40%  { transform: translateY(-200%); animation-timing-function: linear; }
  56%  { transform: translateY(-200%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  60%  { transform: translateY(-300%); animation-timing-function: linear; }
  76%  { transform: translateY(-300%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  80%  { transform: translateY(-400%); animation-timing-function: linear; }
  96%  { transform: translateY(-400%); animation-timing-function: linear; }
  100% { transform: translateY(-400%); }
`;

const fadeScaleIn = keyframes`
  from { opacity: 0; transform: scale(0.94) translateY(6px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);   }
`;

/* ──── Styled Components ──── */
const Overlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  ${({ $fullScreen }) =>
    $fullScreen
      ? css`
          position: fixed;
          inset: 0;
          /* Match the app's own lavender-tinted bg with a strong blur */
          background: rgba(238, 238, 247, 0.92);
          backdrop-filter: blur(14px) saturate(160%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
        `
      : css`
          padding: 3rem 2rem;
        `}
`;

const Box = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  animation: ${fadeScaleIn} 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
`;

/* 
  Three-ring spinner using the app's brand accent #5b6ef5 
  and its lighter variant #7b8ff7 (--clr-accent-2)
*/
const Spinner = styled.div`
  width: 60px;
  height: 60px;
  display: grid;
  border: 4px solid transparent;
  border-radius: 50%;
  border-right-color: #5b6ef5;          /* --clr-accent */
  animation: ${triSpin} 1s infinite linear;

  &::before,
  &::after {
    content: '';
    grid-area: 1/1;
    margin: 2px;
    border: inherit;
    border-radius: 50%;
    animation: ${triSpin} 2s infinite;
  }

  &::before {
    border-right-color: #7b8ff7;        /* --clr-accent-2 */
  }

  &::after {
    margin: 10px;
    border-right-color: #a5b0fa;        /* lighter accent tint */
    animation-duration: 3s;
    animation-direction: reverse;
  }
`;

/*
  Text row: "loading  [cycling word]"
  Uses Space Grotesk (--font-heading) for the static part
  and DM Sans (--font-body) for the blue cycling word
*/
const TextRow = styled.div`
  display: flex;
  align-items: center;
  height: 1.5em;
  padding: 0 4px;
  user-select: none;
  overflow: hidden;
`;

const StaticLabel = styled.span`
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-weight: 600;
  font-size: 1.0625rem;
  color: #3d3d50;           /* --clr-text */
  letter-spacing: -0.02em;
  line-height: 1.5;
  white-space: nowrap;
`;

const WordsWindow = styled.div`
  overflow: hidden;
  height: 1.5em;
  display: flex;
  align-items: flex-start;
  margin-left: 7px;
`;

const WordStack = styled.div`
  display: flex;
  flex-direction: column;
  animation: ${cycleWords} 10s linear infinite;
`;

const Word = styled.span`
  display: block;
  height: 1.5em;
  line-height: 1.5em;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-weight: 600;
  font-size: 1.0625rem;
  letter-spacing: -0.02em;
  color: #5b6ef5;           /* --clr-accent */
  white-space: nowrap;
`;

/* Subtle dot indicator row */
const DotsRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const Dot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#5b6ef5' : '#dddde8')};
  transition: background 0.3s ease;
  display: block;
`;

/* ──── Component ──── */
const Loader = ({ fullScreen = false, text = 'Loading...' }) => {
  const words  = useMemo(() => deriveWords(text), [text]);
  const label  = useMemo(() => deriveLabel(text),  [text]);
  const cycled = [...words, words[0]]; /* repeat first word so cycle loops cleanly */

  return (
    <Overlay $fullScreen={fullScreen}>
      <Box>
        <Spinner />

        <TextRow>
          <StaticLabel>{label}</StaticLabel>
          <WordsWindow>
            <WordStack>
              {cycled.map((w, i) => (
                <Word key={i}>{w}</Word>
              ))}
            </WordStack>
          </WordsWindow>
        </TextRow>

        <DotsRow>
          <Dot $active />
          <Dot />
          <Dot />
        </DotsRow>
      </Box>
    </Overlay>
  );
};

export default Loader;
