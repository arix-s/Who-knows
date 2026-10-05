import generalData from './questions/general.json';
import sportsData from './questions/sports.json';
import scienceData from './questions/science.json';
import religiousData from './questions/religious.json';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'سهل' | 'متوسط' | 'صعب';
  category: string;
}

export interface QuestionCategoryInfo {
  id: string;
  name: string;
  iconName: string;
  description: string;
  totalQuestions: number;
}

const rawDatasets = [generalData, sportsData, scienceData, religiousData];

// Parse and validate all questions
export const allQuestions: Question[] = rawDatasets.flatMap((dataset, dIdx) => {
  const cat = dataset.category || 'عامة';
  return (dataset.questions || []).map((q, qIdx) => {
    // Validation
    const questionText = q.question?.trim() || '';
    const options = Array.isArray(q.options) ? q.options.map(o => String(o).trim()) : [];
    const correctAnswer = q.correctAnswer?.trim() || '';
    const difficulty = (['سهل', 'متوسط', 'صعب'].includes(q.difficulty) ? q.difficulty : 'متوسط') as Question['difficulty'];

    return {
      id: `${cat}-${dIdx}-${qIdx}`,
      question: questionText,
      options,
      correctAnswer,
      difficulty,
      category: cat
    };
  }).filter(q => q.question && q.options.length === 4 && q.options.includes(q.correctAnswer));
});

export const CATEGORIES: QuestionCategoryInfo[] = [
  {
    id: 'all',
    name: 'جميع التصنيفات',
    iconName: 'Globe',
    description: 'تحدي شامل يغطي جميع المواضيع والثقافات',
    totalQuestions: allQuestions.length
  },
  {
    id: 'عامة',
    name: 'معلومات عامة',
    iconName: 'Sparkles',
    description: 'أسئلة عامة وثقافة متنوعة من مختلف المجالات',
    totalQuestions: allQuestions.filter(q => q.category === 'عامة').length
  },
  {
    id: 'رياضية',
    name: 'رياضة وكرة قدم',
    iconName: 'Trophy',
    description: 'أسئلة عن تاريخ الألعاب، البطولات والأرقام القياسية',
    totalQuestions: allQuestions.filter(q => q.category === 'رياضية').length
  },
  {
    id: 'علوم',
    name: 'علوم وطبيعة',
    iconName: 'Atom',
    description: 'فيزياء، كيمياء، أحياء وفلك مع مفاهيم عالمية',
    totalQuestions: allQuestions.filter(q => q.category === 'علوم').length
  },
  {
    id: 'دينية',
    name: 'علوم إسلامية ودينية',
    iconName: 'BookOpen',
    description: 'سيرة نبينا، القرآن الكريم والتاريخ الإمامي',
    totalQuestions: allQuestions.filter(q => q.category === 'دينية').length
  }
];

// Pseudo-random generator based on seed (Mulberry32) for deterministic 1v1 question selection
export function seededRandom(seed: number) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Convert room string seed to numeric seed
export function hashSeed(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (Math.imul(31, hash) + seedStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 12345;
}

/**
 * Generate a deterministic set of questions for a match.
 * @param roomSeed String seed (e.g. room code)
 * @param categoryFilter Category ID ('all', 'عامة', 'رياضية', 'علوم', 'دينية')
 * @param questionCount Number of questions (default 10)
 */
export function generateMatchQuestions(
  roomSeed: string,
  categoryFilter: string = 'all',
  questionCount: number = 10
): Question[] {
  let pool = categoryFilter === 'all' 
    ? [...allQuestions] 
    : allQuestions.filter(q => q.category === categoryFilter);

  if (pool.length === 0) {
    pool = [...allQuestions];
  }

  let seedNum = hashSeed(roomSeed);

  // Millionaire Ladder Style: Sort by difficulty (easy first, then medium, then hard)
  const easy = pool.filter(q => q.difficulty === 'سهل');
  const medium = pool.filter(q => q.difficulty === 'متوسط');
  const hard = pool.filter(q => q.difficulty === 'صعب');

  // Shuffle arrays deterministically
  const shuffleArray = <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seedNum++) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const shfEasy = shuffleArray(easy);
  const shfMed = shuffleArray(medium);
  const shfHard = shuffleArray(hard);

  // Pick balanced sequence
  const result: Question[] = [];
  const easyNeeded = Math.min(3, shfEasy.length);
  const hardNeeded = Math.min(3, shfHard.length);
  const medNeeded = questionCount - easyNeeded - hardNeeded;

  result.push(...shfEasy.slice(0, easyNeeded));
  result.push(...shfMed.slice(0, Math.min(medNeeded, shfMed.length)));
  result.push(...shfHard.slice(0, hardNeeded));

  // If we still need more questions, fill from remaining pool
  if (result.length < questionCount) {
    const remaining = shuffleArray(pool.filter(q => !result.some(r => r.id === q.id)));
    result.push(...remaining.slice(0, questionCount - result.length));
  }

  // Shuffle choices deterministically for each selected question
  return result.slice(0, questionCount).map(q => {
    const shuffledOpts = [...q.options];
    for (let i = shuffledOpts.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seedNum++) * (i + 1));
      [shuffledOpts[i], shuffledOpts[j]] = [shuffledOpts[j], shuffledOpts[i]];
    }
    return {
      ...q,
      options: shuffledOpts
    };
  });
}
