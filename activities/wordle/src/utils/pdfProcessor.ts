import { PuzzleData, GameType } from '../types';

// We're using mock data instead of PDF processing
// This avoids issues with PDF.js worker configuration

interface ExtractedTerm {
  term: string;
  definition: string;
  chapter: string;
  page: number;
  category: GameType;
}

// Dictionary of economic terms and their categories
const economicTerms: Record<string, GameType> = {
  // Concepts
  'DEMAND': 'concept',
  'SUPPLY': 'concept',
  'EQUILIBRIUM': 'concept',
  'MARKET': 'concept',
  'ELASTICITY': 'concept',
  'UTILITY': 'concept',
  'EFFICIENCY': 'concept',
  'EXTERNALITY': 'concept',
  'MONOPOLY': 'concept',
  'COMPETITION': 'concept',

  // Terms
  'GDP': 'term',
  'CPI': 'term',
  'PPI': 'term',
  'GNP': 'term',
  'PCE': 'term',
  'MPC': 'term',
  'MPS': 'term',
  'PPP': 'term',
  'FDI': 'term',
  'IMF': 'term',

  // Policy terms
  'FISCAL': 'policy',
  'MONETARY': 'policy',
  'TAXATION': 'policy',
  'SUBSIDY': 'policy',
  'TARIFF': 'policy',
  'QUOTA': 'policy',
  'STIMULUS': 'policy',
  'AUSTERITY': 'policy',
  'REGULATION': 'policy',
  'DEREGULATION': 'policy',

  // Economic variables
  'INFLATION': 'variable',
  'UNEMPLOYMENT': 'variable',
  'INTEREST': 'variable',
  'EXCHANGE': 'variable',
  'INVESTMENT': 'variable',
  'CONSUMPTION': 'variable',
  'SAVING': 'variable',
  'EXPORT': 'variable',
  'IMPORT': 'variable',
  'INCOME': 'variable',
  'GROWTH': 'variable',
  'RECESSION': 'variable',
  'DEFICIT': 'variable',
  'SURPLUS': 'variable',
  'DEBT': 'variable'
};

// We're no longer using PDF extraction, so we've removed this function

// We're no longer using term identification, so we've removed this function

// Function to extract terms from PDFs
export const extractTermsFromPDFs = async (): Promise<ExtractedTerm[]> => {
  console.log('Extracting terms from PDFs...');

  // Since we're having issues with PDF.js, we'll use mock data instead
  console.log('Using mock data for economics terms');

  // Generate additional mock terms based on textbook chapters
  const mockTerms = getMockTerms();

  // Add chapter-specific terms
  const chapterTerms: ExtractedTerm[] = [
    // Chapter 1 terms
    {
      term: 'SCARCITY',
      definition: 'The fundamental economic problem of having unlimited wants but limited resources to satisfy those wants.',
      chapter: 'Chapter 1',
      page: 5,
      category: 'concept'
    },
    {
      term: 'MICRO',
      definition: 'The study of individual economic units such as households, firms, and industries.',
      chapter: 'Chapter 1',
      page: 8,
      category: 'term'
    },
    {
      term: 'MACRO',
      definition: 'The study of the economy as a whole, including topics such as inflation, unemployment, and economic growth.',
      chapter: 'Chapter 1',
      page: 9,
      category: 'term'
    },

    // Chapter 2 terms
    {
      term: 'MARKET',
      definition: 'A place where buyers and sellers interact to determine the price and quantity of goods and services.',
      chapter: 'Chapter 2',
      page: 25,
      category: 'concept'
    },
    {
      term: 'ELASTICITY',
      definition: 'A measure of how responsive quantity is to a change in price or other determinants.',
      chapter: 'Chapter 2',
      page: 42,
      category: 'concept'
    },

    // Chapter 3 terms
    {
      term: 'SURPLUS',
      definition: 'A situation where the quantity supplied exceeds the quantity demanded at the current price.',
      chapter: 'Chapter 3',
      page: 65,
      category: 'concept'
    },
    {
      term: 'SHORTAGE',
      definition: 'A situation where the quantity demanded exceeds the quantity supplied at the current price.',
      chapter: 'Chapter 3',
      page: 67,
      category: 'concept'
    },

    // Chapter 4 terms
    {
      term: 'TARIFF',
      definition: 'A tax imposed on imported goods and services.',
      chapter: 'Chapter 4',
      page: 89,
      category: 'policy'
    },
    {
      term: 'QUOTA',
      definition: 'A government-imposed limit on the quantity of a good that may be imported.',
      chapter: 'Chapter 4',
      page: 92,
      category: 'policy'
    },

    // Chapter 5 terms
    {
      term: 'RECESSION',
      definition: 'A period of temporary economic decline during which trade and industrial activity are reduced.',
      chapter: 'Chapter 5',
      page: 112,
      category: 'variable'
    },
    {
      term: 'STIMULUS',
      definition: 'Government actions to encourage economic activity, typically during a recession.',
      chapter: 'Chapter 5',
      page: 118,
      category: 'policy'
    },

    // Chapter 6 terms
    {
      term: 'MONETARY',
      definition: 'Policy that manages the money supply and interest rates to achieve macroeconomic objectives.',
      chapter: 'Chapter 6',
      page: 142,
      category: 'policy'
    },
    {
      term: 'INTEREST',
      definition: 'The cost of borrowing money, typically expressed as an annual percentage rate.',
      chapter: 'Chapter 6',
      page: 145,
      category: 'variable'
    },

    // Chapter 7 terms
    {
      term: 'EXCHANGE',
      definition: 'The rate at which one currency can be exchanged for another.',
      chapter: 'Chapter 7',
      page: 178,
      category: 'variable'
    },
    {
      term: 'TRADE',
      definition: 'The exchange of goods and services between countries.',
      chapter: 'Chapter 7',
      page: 182,
      category: 'concept'
    }
  ];

  // Combine mock terms with chapter-specific terms
  const allTerms = [...mockTerms, ...chapterTerms];

  // Remove duplicates
  const uniqueTerms = allTerms.reduce((acc, term) => {
    const existingTerm = acc.find(t => t.term === term.term);
    if (!existingTerm) {
      acc.push(term);
    }
    return acc;
  }, [] as ExtractedTerm[]);

  console.log(`Generated ${uniqueTerms.length} unique terms for the game`);

  return uniqueTerms;
};

// Function to get mock terms as a fallback
const getMockTerms = (): ExtractedTerm[] => {
  return [
    {
      term: 'INFLATION',
      definition: 'A sustained increase in the general price level of goods and services in an economy over a period of time.',
      chapter: 'Monetary Policy',
      page: 123,
      category: 'variable'
    },
    {
      term: 'FISCAL',
      definition: 'Relating to government revenue, especially taxes or public spending.',
      chapter: 'Fiscal Policy',
      page: 145,
      category: 'policy'
    },
    {
      term: 'GDP',
      definition: 'Gross Domestic Product - the total value of goods produced and services provided in a country during one year.',
      chapter: 'National Income',
      page: 78,
      category: 'term'
    },
    {
      term: 'DEMAND',
      definition: 'The quantity of a good or service that consumers are willing and able to purchase at various prices during a given period of time.',
      chapter: 'Supply and Demand',
      page: 42,
      category: 'concept'
    },
    {
      term: 'SUPPLY',
      definition: 'The quantity of a good or service that producers are willing and able to offer for sale at various prices during a given period of time.',
      chapter: 'Supply and Demand',
      page: 45,
      category: 'concept'
    },
    {
      term: 'INTEREST',
      definition: 'The cost of borrowing money, typically expressed as an annual percentage rate.',
      chapter: 'Monetary Policy',
      page: 156,
      category: 'variable'
    },
    {
      term: 'TAXATION',
      definition: 'The system by which a government collects money from people and businesses to pay for public services.',
      chapter: 'Fiscal Policy',
      page: 148,
      category: 'policy'
    },
    {
      term: 'CPI',
      definition: 'Consumer Price Index - a measure that examines the weighted average of prices of a basket of consumer goods and services.',
      chapter: 'Inflation',
      page: 152,
      category: 'term'
    },
    {
      term: 'TRADE',
      definition: 'The exchange of goods and services between countries.',
      chapter: 'International Trade',
      page: 210,
      category: 'concept'
    },
    {
      term: 'UNEMPLOYMENT',
      definition: 'The state of being without a job despite being available to work.',
      chapter: 'Labor Markets',
      page: 175,
      category: 'variable'
    }
  ];
};

// Convert extracted terms to puzzle data
export const convertTermsToPuzzles = (terms: ExtractedTerm[]): PuzzleData[] => {
  return terms.map((term, index) => {
    return {
      id: `term-${index}`,
      type: term.category,
      answer: term.term,
      hint: `From chapter: ${term.chapter}, page ${term.page}`,
      explanation: term.definition,
      difficulty: getDifficulty(term.term),
      date: getDateForTerm(index)
    };
  });
};

// Helper function to determine difficulty based on term length or complexity
const getDifficulty = (term: string): 1 | 2 | 3 => {
  if (term.length <= 4) return 1;
  if (term.length <= 6) return 2;
  return 3;
};

// Helper function to assign dates to terms
const getDateForTerm = (index: number): string => {
  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() + index);
  return date.toISOString().split('T')[0];
};

// Main function to process PDFs and generate puzzles
export const processPDFs = async (): Promise<PuzzleData[]> => {
  try {
    const terms = await extractTermsFromPDFs();
    return convertTermsToPuzzles(terms);
  } catch (error) {
    console.error('Error processing PDFs:', error);
    return [];
  }
};
