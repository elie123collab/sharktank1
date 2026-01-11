export enum ProjectStatus {
  PENDING = 'Pending',
  FUNDING = 'Funding',
  ACTIVE = 'Active',
  COMPLETED = 'Completed'
}

export enum TransactionStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PAID = 'Paid'
}

export enum TransactionType {
  DEPOSIT = 'Deposit',
  WITHDRAWAL = 'Withdrawal'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  balance: number;
  role: 'user' | 'admin';
  avatar: string;
}

export interface ChartPoint {
  time: number;
  value: number;
}

export interface Project {
  id: string;
  founderId: string;
  founderName: string;
  title: string;
  pitch: string;
  description: string;
  problem: string;
  solution: string;
  businessModel: string;
  category: string;
  fundingGoal: number;
  amountRaised: number; // Total Pool Liquidity
  creatorFees: number; // Accumulated fees for the founder
  firstInvestorId?: string;
  totalUnits: number;
  investorsCount: number;
  equityOffered: number;
  strategyRate: number;
  timeline: string;
  status: ProjectStatus;
  isTrending: boolean;
  isFeatured: boolean;
  createdAt: number;
  image: string;
  history?: ChartPoint[]; 
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  note: string;
  timestamp: number;
}

export interface Investment {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectTitle: string;
  amount: number; 
  units: number; 
  initialAmount: number;
  totalGains: number; 
  timestamp: number;
}

export interface AppState {
  currentUser: User;
  allUsers: User[];
  projects: Project[];
  transactions: Transaction[];
  investments: Investment[];
  paymentInstructions: string;
}