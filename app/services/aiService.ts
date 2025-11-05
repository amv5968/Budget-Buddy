import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserProfile } from './authService';
import { getBudgets } from './budgetService';
import { getGoals } from './goalService';
import { getTransactions, getTransactionStats } from './transactionService';

const GEMINI_API_KEY = 'AIzaSyDPjYpO5PU3eowsFLjMk-NV3DWvpG-_mSI';

let genAI: GoogleGenerativeAI | null = null;
let initializationError: string | null = null;

const initializeAI = () => {
  const trimmedKey = GEMINI_API_KEY?.trim();
  
  // Check if key is missing or still set to placeholder
  if (!trimmedKey || trimmedKey === 'YOUR_GEMINI_API_KEY_HERE') {
    initializationError = 'API_KEY_NOT_CONFIGURED';
    console.warn('Gemini API key not configured');
    return;
  }

  try {
    genAI = new GoogleGenerativeAI(trimmedKey);
    initializationError = null;
    console.log('Gemini AI initialized successfully');
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
    initializationError = error instanceof Error ? error.message : 'Unknown initialization error';
  }
};

initializeAI();

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const getUserFinancialContext = async (): Promise<string> => {
  try {
    const [transactions, stats, budgets, goals, profile] = await Promise.all([
      getTransactions(),
      getTransactionStats(),
      getBudgets(),
      getGoals(),
      getUserProfile(),
    ]);

    const expensesByCategory: { [key: string]: number } = {};
    const incomeByCategory: { [key: string]: number } = {};
    
    transactions.forEach((t) => {
      if (t.type === 'Expense') {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(t.amount);
      } else {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      }
    });

    const allowanceRemaining = profile.monthlyAllowance - stats.totalExpense;
    const allowanceUsagePercent = profile.monthlyAllowance > 0 
      ? (stats.totalExpense / profile.monthlyAllowance) * 100 
      : 0;

    const context = `
USER FINANCIAL PROFILE:
- Username: ${profile.username || 'User'}
- Monthly Allowance: $${profile.monthlyAllowance || 0}

FINANCIAL SUMMARY:
- Total Income: $${stats.totalIncome.toFixed(2)}
- Total Expenses: $${stats.totalExpense.toFixed(2)}
- Current Balance: $${stats.balance.toFixed(2)}
- Remaining Allowance: $${allowanceRemaining.toFixed(2)}
- Allowance Usage: ${allowanceUsagePercent.toFixed(1)}%

EXPENSE BREAKDOWN BY CATEGORY:
${Object.entries(expensesByCategory)
  .sort(([, a], [, b]) => b - a)
  .map(([category, amount]) => `- ${category}: $${amount.toFixed(2)}`)
  .join('\n') || '- No expenses yet'}

INCOME BREAKDOWN BY CATEGORY:
${Object.entries(incomeByCategory)
  .sort(([, a], [, b]) => b - a)
  .map(([category, amount]) => `- ${category}: $${amount.toFixed(2)}`)
  .join('\n') || '- No income yet'}

ACTIVE BUDGETS:
${budgets.length > 0 
  ? budgets.map((b) => {
      const percentUsed = b.totalAmount > 0 ? (b.spentAmount / b.totalAmount) * 100 : 0;
      return `- ${b.category}: $${b.spentAmount.toFixed(2)} / $${b.totalAmount.toFixed(2)} (${percentUsed.toFixed(0)}% used)`;
    }).join('\n')
  : '- No budgets set'}

SAVINGS GOALS:
${goals.length > 0
  ? goals.map((g) => {
      const percentComplete = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
      return `- ${g.name}: $${g.savedAmount.toFixed(2)} / $${g.targetAmount.toFixed(2)} (${percentComplete.toFixed(0)}% complete)`;
    }).join('\n')
  : '- No savings goals'}

RECENT TRANSACTIONS (Last 5):
${transactions.slice(0, 5).map((t) => 
  `- ${t.type}: ${t.category} - $${Math.abs(t.amount).toFixed(2)} (${new Date(t.date).toLocaleDateString()})`
).join('\n') || '- No recent transactions'}
`;

    return context;
  } catch (error) {
    console.error('Error getting financial context:', error);
    return 'Unable to load financial data. Please ensure you have transactions, budgets, or goals set up.';
  }
};

export const sendMessageToAI = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> => {
  if (initializationError === 'API_KEY_NOT_CONFIGURED') {
    throw new Error('Please configure your Gemini API key in app/services/aiService.ts\n\nSee GEMINI_API_KEY_SETUP.md for instructions.');
  }

  if (initializationError) {
    throw new Error(`Failed to initialize AI service: ${initializationError}`);
  }

  if (!genAI) {
    throw new Error('AI service not properly initialized. Please check your API key configuration.');
  }

  try {
    const financialContext = await getUserFinancialContext();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `You are a helpful AI financial advisor for Budget Buddy, a personal finance management app. Your role is to:

1. Help users understand their spending patterns
2. Provide budgeting advice based on their actual financial data
3. Suggest ways to save money and reach financial goals
4. Answer questions about their income, expenses, budgets, and savings goals
5. Be encouraging and supportive while being realistic
6. Provide actionable, specific advice based on their data

Here is the user's current financial situation:
${financialContext}

IMPORTANT GUIDELINES:
- Be conversational and friendly, but professional
- Use the financial data provided to give specific, personalized advice
- If asked about specific transactions, budgets, or goals, reference the actual data
- Suggest practical steps the user can take to improve their financial health
- If data is missing, encourage the user to add it to the app
- Keep responses concise but informative (2-4 paragraphs max unless asked for detail)

Now respond to the user's message:`;

    const conversationText = conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const fullPrompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversationText}

USER'S LATEST MESSAGE: ${userMessage}

Please provide a helpful, personalized response based on their financial data:`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error: any) {
    console.error('Error sending message to AI:', error);
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
      throw new Error('Invalid API key. Please verify your Gemini API key is correct.');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('API quota exceeded. Please try again in a minute.');
    }

    if (error.message?.includes('PERMISSION_DENIED')) {
      throw new Error('API key does not have permission to use this model. Check your API key settings.');
    }
    
    throw new Error(`Failed to get AI response: ${error.message || 'Unknown error occurred'}`);
  }
};

export const getQuickInsights = async (): Promise<string[]> => {
  const defaultInsights = [
    'Configure your Gemini API key to get personalized insights',
    'Track your spending regularly to stay on budget',
    'Set realistic savings goals to stay motivated',
  ];

  if (!genAI) {
    return defaultInsights;
  }

  try {
    const context = await getUserFinancialContext();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Based on this financial data:
${context}

Provide 3 quick, actionable insights or tips for this user. Keep each insight to 1 sentence.
Format as a simple list without numbers or bullets, just one insight per line.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const insights = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 3);

    return insights.length > 0 ? insights : defaultInsights;
  } catch (error) {
    console.error('Error getting quick insights:', error);
    return [
      'Track your spending regularly to stay on budget',
      'Set realistic savings goals to stay motivated',
      'Review your expenses to find areas to cut back',
    ];
  }
};

export const getSuggestedQuestions = async (): Promise<string[]> => {
  const defaultQuestions = [
    'How can I reduce my spending?',
    'Am I on track with my budget?',
    'What areas should I focus on saving?',
    'How can I reach my savings goals faster?',
  ];

  try {
    const stats = await getTransactionStats();
    const budgets = await getBudgets();
    const goals = await getGoals();
    const profile = await getUserProfile();

    const questions: string[] = [];

    if (stats.totalExpense > profile.monthlyAllowance * 0.9) {
      questions.push('Why am I overspending my budget?');
    }

    if (budgets.length > 0) {
      const overBudget = budgets.filter(b => b.spentAmount > b.totalAmount * 0.9);
      if (overBudget.length > 0) {
        questions.push(`How can I reduce my ${overBudget[0].category} spending?`);
      }
    }

    if (goals.length > 0) {
      questions.push('How can I reach my savings goals faster?');
    }

    if (stats.totalIncome > 0 && stats.totalExpense > 0) {
      questions.push('What percentage of my income should I save?');
    }

    while (questions.length < 4) {
      const remaining = defaultQuestions.filter(q => !questions.includes(q));
      if (remaining.length === 0) break;
      questions.push(remaining[0]);
    }

    return questions.slice(0, 4);
  } catch (error) {
    console.error('Error getting suggested questions:', error);
    return defaultQuestions;
  }
};