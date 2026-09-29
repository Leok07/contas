export type Person = 'leeo' | 'marii';

export type SplitType = 
  | 'full_debt'       // 100% da despesa assumida pelo outro (ex: Férias adiantadas, compra passada no cartão)
  | 'split_50_50'     // 50% para cada (ex: restaurante, mercado)
  | 'payment_pix';    // Acerto direto / transferência PIX de um para o outro

export type CategoryKey = 
  | 'general'
  | 'vacation'
  | 'credit_card'
  | 'food'
  | 'housing'
  | 'transport'
  | 'bills';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  code: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paidBy: Person;
  splitType: SplitType;
  category: CategoryKey;
  notes?: string;
  createdAt: number;
}

export interface BalanceSummary {
  spentLeeo: number;
  spentMarii: number;
  mariiOwesLeeo: number;
  leeoOwesMarii: number;
  netBalance: number; // Positivo: Marii deve a Leeo; Negativo: Leeo deve a Marii
  debtor: Person | 'none';
  debtAmount: number;
}

export interface BillingCycle {
  key: string;       // Formato 'YYYY-MM' baseado no início do ciclo (dia 10)
  startDate: string; // 'YYYY-MM-10'
  endDate: string;   // 'YYYY-MM-09' do mês seguinte
  label: string;     // Ex: '10/SET — 09/OUT'
  shortLabel: string;// Ex: 'SET/OUT'
  isCurrent: boolean;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
