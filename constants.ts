
import { ProjectStatus, User, Project, TransactionType, TransactionStatus, AppState } from './types';

// Trading Platform Constants
export const FEE_RATE = 0.03;   // 3% processing fee on withdrawals
export const MARKET_VOLATILITY = 0.003; // 0.3% max random fluctuation

// Default Admin Account
export const INITIAL_USER: User = {
  id: 'user-admin',
  name: 'System Admin',
  email: 'admin@sharktank.com',
  password: 'admin123',
  balance: 0, // Reset to 0 as per user request
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
};

export const MOCK_PROJECTS: Project[] = [];

export const INITIAL_STATE: AppState = {
  currentUser: INITIAL_USER,
  allUsers: [INITIAL_USER],
  projects: [],
  transactions: [],
  investments: [],
  paymentInstructions: 'For Deposits: Please transfer the desired USD amount to our bank portal. Routing: 011000015. Account: 9988776655. Reference your email address in the transfer note.'
};
