import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import {
  AccountBalance,
  AccountBalanceWallet,
  Add,
  Assessment,
  AttachMoney,
  Block,
  CheckCircle,
  Code,
  CreditCard,
  Delete,
  Edit,
  Groups,
  Key,
  Logout,
  Menu as MenuIcon,
  Payments,
  Person,
  Refresh,
  Settings,
  VerifiedUser,
  Wallet,
} from '@mui/icons-material';

import { AxiosError } from 'axios';

import apiClient from '../services/apiClient';

// ============================================================
// TYPES
// ============================================================

type UserStatus =
  | 'active'
  | 'blocked'
  | 'suspended'
  | 'disabled';

type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAccounts: number;
  totalTransactions: number;
  pendingTransactions: number;
  completedDeposits: number;
  completedWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  totalAccountBalance: number;
  activeInvestmentPlans: number;
}

interface Account {
  id: number;
  accountNumber?: string;
  accountType?: string;
  accountName?: string;
  currency?: string;
  balance?: number;
  deposit?: number;
  profits?: number;
  availableBalance?: number;
  bonus?: number;
  referrerBonus?: number;
  buyingPower?: number;
  marginAvailable?: number;
  status?: string;
}

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  country?: string;
  preferredCurrency?: string;
  referralCode?: string;
  referrerCode?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  identityVerificationStatus?: string;
  createdAt?: string;
  account?: Account | null;
}

interface Transaction {
  id: number;
  accountId: number;
  transactionReference?: string;
  transactionType?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  description?: string;
  proofOfPaymentUrl?: string;
  verifiedBy?: number;
  verifiedAt?: string;
  adminNote?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
}

interface KycRequest {
  id: number;
  userId: number;
  documentType?: string;
  documentNumber?: string;
  documentUrl?: string;
  status?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    country?: string;
  };
}

interface InvestmentPlan {
  id: number;
  name: string;
  description?: string;
  minimumAmount: number;
  maximumAmount?: number | null;
  roiPercent: number;
  durationDays: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SignalPlan {
  id: number;
  name: string;
  description?: string;
  strength: number;
  accuracyPercent: number;
  durationDays: number;
  price: number;
  currency: string;
  status: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface UserSignal {
  id: number;
  strength: number;
  status: string;
  enabled: boolean;
  note?: string;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  plan?: SignalPlan | null;
}

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  currency: string;
  details?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  walletAddress?: string;
  instructions?: string;
  status: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface WithdrawalDetails {
  [key: string]: unknown;
}

interface AdminDashboardProps {
  initialTab?: number;
}

// ============================================================
// API
// ============================================================

const api = apiClient;

// ============================================================
// HELPERS
// ============================================================

const numberValue = (value: unknown): number => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const formatMoney = (
  amount: unknown,
  currency = 'USD'
): string => {
  const value = numberValue(amount);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getErrorMessage = (
  error: unknown
): string => {
  const axiosError =
    error as AxiosError<{
      message?: string;
      error?: string;
    }>;

  return (
    axiosError.response?.data?.message ||
    axiosError.response?.data?.error ||
    axiosError.message ||
    'Something went wrong.'
  );
};

const statusColor = (
  status?: string
):
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info' => {
  const value =
    String(status || '').toUpperCase();

  if (
    value === 'ACTIVE' ||
    value === 'COMPLETED' ||
    value === 'APPROVED'
  ) {
    return 'success';
  }

  if (
    value === 'PENDING' ||
    value === 'PROCESSING'
  ) {
    return 'warning';
  }

  if (
    value === 'FAILED' ||
    value === 'CANCELLED' ||
    value === 'REJECTED' ||
    value === 'BLOCKED' ||
    value === 'SUSPENDED' ||
    value === 'DISABLED' ||
    value === 'INACTIVE'
  ) {
    return 'error';
  }

  return 'default';
};

// ============================================================
// COMPONENT
// ============================================================

const AdminDashboard: React.FC<
  AdminDashboardProps
> = ({
  initialTab = 0,
}) => {
  const navigate = useNavigate();

  const theme = useTheme();

  const isMobile = useMediaQuery(
    theme.breakpoints.down('md')
  );

  // ==========================================================
  // SECTIONS
  // ==========================================================

  const sections = [
    'dashboard',
    'users',
    'accounts',
    'transactions',
    'deposits',
    'withdrawals',
    'kyc',
    'investment-plans',
    'signal-plans',
    'payment-methods',
    'funding',
    'withdrawal-code',
    'settings',
  ] as const;

  const initialSection =
    sections[initialTab] ||
    'dashboard';

  const [section, setSection] =
    useState<string>(
      initialSection
    );

  const [mobileOpen, setMobileOpen] =
    useState(false);

  // ==========================================================
  // GENERAL
  // ==========================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  // ==========================================================
  // DATA
  // ==========================================================

  const [dashboard, setDashboard] =
    useState<DashboardStats | null>(
      null
    );

  const [users, setUsers] =
    useState<User[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [deposits, setDeposits] =
    useState<Transaction[]>([]);

  const [withdrawals, setWithdrawals] =
    useState<Transaction[]>([]);

  const [kycRequests, setKycRequests] =
    useState<KycRequest[]>([]);

  const [investmentPlans, setInvestmentPlans] =
    useState<InvestmentPlan[]>([]);

  const [signalPlans, setSignalPlans] =
    useState<SignalPlan[]>([]);

  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>([]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [search, setSearch] =
    useState('');

  // ==========================================================
  // USER
  // ==========================================================

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [userDialogOpen, setUserDialogOpen] =
    useState(false);

  const [userLoading, setUserLoading] =
    useState(false);

  // ==========================================================
  // CREDIT / DEBIT
  // ==========================================================

  const [moneyDialog, setMoneyDialog] =
    useState<{
      open: boolean;
      type: 'fund' | 'debit';
      user: User | null;
    }>({
      open: false,
      type: 'fund',
      user: null,
    });

  const [moneyAmount, setMoneyAmount] =
    useState('');

  const [moneyCurrency, setMoneyCurrency] =
    useState('USD');

  const [moneyDescription, setMoneyDescription] =
    useState('');

  const [moneyLoading, setMoneyLoading] =
    useState(false);

  // ==========================================================
  // TRANSACTION
  // ==========================================================

  const [
    transactionDialogOpen,
    setTransactionDialogOpen,
  ] = useState(false);

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState<Transaction | null>(
    null
  );

  const [
    transactionStatus,
    setTransactionStatus,
  ] = useState<TransactionStatus>(
    'PENDING'
  );

  const [
    transactionNote,
    setTransactionNote,
  ] = useState('');

  const [
    transactionLoading,
    setTransactionLoading,
  ] = useState(false);

  // ==========================================================
  // WITHDRAWAL DETAILS
  // ==========================================================

  const [
    withdrawalDetailsOpen,
    setWithdrawalDetailsOpen,
  ] = useState(false);

  const [
    selectedWithdrawal,
    setSelectedWithdrawal,
  ] = useState<Transaction | null>(
    null
  );

  const [
    withdrawalDetails,
    setWithdrawalDetails,
  ] = useState<WithdrawalDetails | null>(
    null
  );

  const [
    withdrawalDetailsLoading,
    setWithdrawalDetailsLoading,
  ] = useState(false);

  // ==========================================================
  // WITHDRAWAL CODE
  // ==========================================================

  const [
    withdrawalCodeOpen,
    setWithdrawalCodeOpen,
  ] = useState(false);

  const [
    generatedWithdrawalCode,
    setGeneratedWithdrawalCode,
  ] = useState('');

  const [
    withdrawalCodeLoading,
    setWithdrawalCodeLoading,
  ] = useState(false);

  // ==========================================================
  // INVESTMENT
  // ==========================================================

  const emptyInvestmentPlan = {
    name: '',
    description: '',
    minimumAmount: '',
    maximumAmount: '',
    roiPercent: '',
    durationDays: '30',
    status: 'ACTIVE',
  };

  const [
    investmentDialogOpen,
    setInvestmentDialogOpen,
  ] = useState(false);

  const [
    editingInvestmentPlan,
    setEditingInvestmentPlan,
  ] = useState<InvestmentPlan | null>(
    null
  );

  const [
    investmentForm,
    setInvestmentForm,
  ] = useState(
    emptyInvestmentPlan
  );

  const [
    investmentLoading,
    setInvestmentLoading,
  ] = useState(false);

  // ==========================================================
  // SIGNAL
  // ==========================================================

  const emptySignalPlan = {
    name: '',
    description: '',
    strength: '50',
    accuracyPercent: '0',
    durationDays: '30',
    price: '0',
    currency: 'USD',
    status: 'ACTIVE',
  };

  const [
    signalDialogOpen,
    setSignalDialogOpen,
  ] = useState(false);

  const [
    editingSignalPlan,
    setEditingSignalPlan,
  ] = useState<SignalPlan | null>(
    null
  );

  const [
    signalForm,
    setSignalForm,
  ] = useState(
    emptySignalPlan
  );

  const [
    signalLoading,
    setSignalLoading,
  ] = useState(false);

  // ==========================================================
  // USER SIGNAL
  // ==========================================================

  const [
    userSignalDialogOpen,
    setUserSignalDialogOpen,
  ] = useState(false);

  const [
    userSignalUser,
    setUserSignalUser,
  ] = useState<User | null>(null);

  const [
    userSignal,
    setUserSignal,
  ] = useState<UserSignal | null>(
    null
  );

  const [
    userSignalPlanId,
    setUserSignalPlanId,
  ] = useState('');

  const [
    userSignalStrength,
    setUserSignalStrength,
  ] = useState('50');

  const [
    userSignalEnabled,
    setUserSignalEnabled,
  ] = useState(true);

  const [
    userSignalNote,
    setUserSignalNote,
  ] = useState('');

  const [
    userSignalLoading,
    setUserSignalLoading,
  ] = useState(false);

  // ==========================================================
  // PAYMENT METHODS
  // ==========================================================

  const emptyPaymentMethod = {
    name: '',
    type: 'BANK',
    currency: 'USD',
    details: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    walletAddress: '',
    instructions: '',
    status: 'ACTIVE',
  };

  const [
    paymentDialogOpen,
    setPaymentDialogOpen,
  ] = useState(false);

  const [
    editingPaymentMethod,
    setEditingPaymentMethod,
  ] = useState<PaymentMethod | null>(
    null
  );

  const [
    paymentForm,
    setPaymentForm,
  ] = useState(
    emptyPaymentMethod
  );

  const [
    paymentLoading,
    setPaymentLoading,
  ] = useState(false);

  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  const loadDashboard =
    useCallback(async () => {
      const response =
        await api.get(
          '/admin/dashboard'
        );

      setDashboard(
        response.data?.dashboard ||
        null
      );
    }, []);

  // ==========================================================
  // LOAD USERS
  // ==========================================================

  const loadUsers =
    useCallback(async () => {
      const response =
        await api.get(
          '/admin/users'
        );

      setUsers(
        response.data?.users ||
        []
      );
    }, []);

  // ==========================================================
  // LOAD TRANSACTIONS
  // ==========================================================

  const loadTransactions =
    useCallback(async () => {
      const response =
        await api.get(
          '/admin/transactions'
        );

      setTransactions(
        response.data?.transactions ||
        []
      );
    }, []);

  // ==========================================================
  // LOAD DEPOSITS
  // ==========================================================

  const loadDeposits =
    useCallback(async () => {
      const response =
        await api.get(
          '/admin/deposits'
        );

      setDeposits(
        response.data?.deposits ||
        []
      );
    }, []);

  // ==========================================================
  // LOAD WITHDRAWALS
  // ==========================================================

  const loadWithdrawals =
    useCallback(async () => {
      const response =
        await api.get(
          '/admin/withdrawals'
        );

      setWithdrawals(
        response.data?.withdrawals ||
        []
      );
    }, []);

  // ==========================================================
  // LOAD KYC
  // ==========================================================

  const loadKyc =
    useCallback(async () => {
      const response =
        await api.get(
          '/admin/kyc'
        );

      setKycRequests(
        response.data?.requests ||
        []
      );
    }, []);

  // ==========================================================
  // LOAD INVESTMENT PLANS
  // ==========================================================

  const loadInvestmentPlans =
    useCallback(async () => {
      const response =
        await api.get(
          '/admin/investment-plans'
        );

      setInvestmentPlans(
        response.data?.plans ||
        []
      );
    }, []);

  // ==========================================================
  // LOAD SIGNAL PLANS
  // ==========================================================

  const loadSignalPlans =
    useCallback(async () => {
      const response =
        await api.get(
          '/admin/signal-plans'
        );

      setSignalPlans(
        response.data?.plans ||
        []
      );
    }, []);

  // ==========================================================
  // LOAD PAYMENT METHODS
  // ==========================================================

  const loadPaymentMethods =
    useCallback(async () => {
      const response =
        await api.get(
          '/admin/payment-methods'
        );

      setPaymentMethods(
        response.data?.paymentMethods ||
        []
      );
    }, []);

  // ==========================================================
  // LOAD ALL
  // ==========================================================

  const loadAll =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        await Promise.all([
          loadDashboard(),
          loadUsers(),
          loadTransactions(),
          loadDeposits(),
          loadWithdrawals(),
          loadKyc(),
          loadInvestmentPlans(),
          loadSignalPlans(),
          loadPaymentMethods(),
        ]);
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setLoading(false);
      }
    }, [
      loadDashboard,
      loadUsers,
      loadTransactions,
      loadDeposits,
      loadWithdrawals,
      loadKyc,
      loadInvestmentPlans,
      loadSignalPlans,
      loadPaymentMethods,
    ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ==========================================================
  // SECTION
  // ==========================================================

  const selectSection = (
    value: string
  ) => {
    setSection(value);

    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const refreshData = async () => {
    await loadAll();

    setSuccess(
      'Admin data refreshed successfully.'
    );
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {
    localStorage.removeItem(
      'adminToken'
    );

    localStorage.removeItem(
      'admin'
    );

    localStorage.removeItem(
      'accessToken'
    );

    localStorage.removeItem(
      'token'
    );

    navigate('/admin/login');
  };

  // ==========================================================
  // USER DETAILS
  // ==========================================================

  const openUser = async (
    user: User
  ) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
    setUserLoading(true);

    try {
      const response =
        await api.get(
          `/admin/users/${user.id}`
        );

      setSelectedUser(
        response.data?.user ||
        user
      );
    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setUserLoading(false);
    }
  };

  // ==========================================================
  // USER STATUS
  // ==========================================================

  const changeUserStatus =
    async (
      user: User,
      status: UserStatus
    ) => {
      try {
        await api.patch(
          `/admin/users/${user.id}/status`,
          {
            status,
          }
        );

        setSuccess(
          `User status changed to ${status}.`
        );

        await Promise.all([
          loadUsers(),
          loadDashboard(),
        ]);

        setSelectedUser(
          (current) =>
            current
              ? {
                  ...current,
                  status,
                }
              : current
        );
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      }
    };

  // ==========================================================
  // OPEN CREDIT / DEBIT
  // ==========================================================

  const openMoneyDialog = (
    user: User,
    type: 'fund' | 'debit'
  ) => {
    setMoneyDialog({
      open: true,
      type,
      user,
    });

    setMoneyAmount('');

    setMoneyCurrency(
      user.account?.currency ||
      user.preferredCurrency ||
      'USD'
    );

    setMoneyDescription('');
  };

  // ==========================================================
  // SUBMIT CREDIT / DEBIT
  // ==========================================================

  const submitMoneyOperation =
    async () => {
      if (!moneyDialog.user) {
        return;
      }

      const amount =
        Number(moneyAmount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        setError(
          'Please enter a valid amount greater than zero.'
        );

        return;
      }

      setMoneyLoading(true);

      try {
        const endpoint =
          moneyDialog.type === 'fund'
            ? `/admin/users/${moneyDialog.user.id}/fund`
            : `/admin/users/${moneyDialog.user.id}/debit`;

        const response =
          await api.post(
            endpoint,
            {
              amount,
              currency:
                moneyCurrency,
              description:
                moneyDescription,
            }
          );

        setSuccess(
          response.data?.message ||
          (
            moneyDialog.type === 'fund'
              ? 'Account credited successfully.'
              : 'Account debited successfully.'
          )
        );

        setMoneyDialog({
          open: false,
          type: 'fund',
          user: null,
        });

        await Promise.all([
          loadDashboard(),
          loadUsers(),
          loadTransactions(),
          loadDeposits(),
          loadWithdrawals(),
        ]);
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setMoneyLoading(false);
      }
    };

  // ==========================================================
  // TRANSACTION DIALOG
  // ==========================================================

  const openTransactionStatus =
    (
      transaction: Transaction
    ) => {
      setSelectedTransaction(
        transaction
      );

      const currentStatus =
        String(
          transaction.status ||
          'PENDING'
        ).toUpperCase();

      const allowedStatuses:
        TransactionStatus[] = [
          'PENDING',
          'PROCESSING',
          'COMPLETED',
          'FAILED',
          'CANCELLED',
        ];

      setTransactionStatus(
        allowedStatuses.includes(
          currentStatus as TransactionStatus
        )
          ? currentStatus as TransactionStatus
          : 'PENDING'
      );

      setTransactionNote(
        transaction.adminNote ||
        ''
      );

      setTransactionDialogOpen(
        true
      );
    };

  // ==========================================================
  // UPDATE TRANSACTION
  // ==========================================================

  const updateTransaction =
    async () => {
      if (!selectedTransaction) {
        return;
      }

      setTransactionLoading(true);

      try {
        const response =
          await api.patch(
            `/admin/transactions/${selectedTransaction.id}/status`,
            {
              status:
                transactionStatus,
              adminNote:
                transactionNote,
            }
          );

        setSuccess(
          response.data?.message ||
          'Transaction updated.'
        );

        setTransactionDialogOpen(
          false
        );

        await Promise.all([
          loadDashboard(),
          loadTransactions(),
          loadDeposits(),
          loadWithdrawals(),
          loadUsers(),
        ]);
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setTransactionLoading(false);
      }
    };

  // ==========================================================
  // APPROVE WITHDRAWAL
  // ==========================================================

  const approveWithdrawal =
    async (
      withdrawal: Transaction
    ) => {
      if (
        !window.confirm(
          `Approve withdrawal #${withdrawal.id} for ${formatMoney(
            withdrawal.amount,
            withdrawal.currency ||
              'USD'
          )}?`
        )
      ) {
        return;
      }

      setTransactionLoading(true);

      try {
        const response =
          await api.patch(
            `/admin/transactions/${withdrawal.id}/status`,
            {
              status: 'COMPLETED',
              adminNote:
                'Withdrawal approved by administrator.',
            }
          );

        setSuccess(
          response.data?.message ||
          'Withdrawal approved successfully.'
        );

        await Promise.all([
          loadDashboard(),
          loadTransactions(),
          loadWithdrawals(),
          loadUsers(),
        ]);
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setTransactionLoading(false);
      }
    };

  // ==========================================================
  // REJECT WITHDRAWAL
  // ==========================================================

  const rejectWithdrawal =
    async (
      withdrawal: Transaction
    ) => {
      if (
        !window.confirm(
          `Reject withdrawal #${withdrawal.id}?`
        )
      ) {
        return;
      }

      setTransactionLoading(true);

      try {
        const response =
          await api.patch(
            `/admin/withdrawals/${withdrawal.id}/reject`
          );

        setSuccess(
          response.data?.message ||
          'Withdrawal rejected.'
        );

        await Promise.all([
          loadDashboard(),
          loadWithdrawals(),
          loadTransactions(),
          loadUsers(),
        ]);
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setTransactionLoading(false);
      }
    };

  // ==========================================================
  // REVERSE WITHDRAWAL
  // ==========================================================

  const reverseWithdrawal =
    async (
      withdrawal: Transaction
    ) => {
      if (
        !window.confirm(
          `Reverse completed withdrawal #${withdrawal.id}?`
        )
      ) {
        return;
      }

      setTransactionLoading(true);

      try {
        const response =
          await api.patch(
            `/admin/withdrawals/${withdrawal.id}/reverse`
          );

        setSuccess(
          response.data?.message ||
          'Withdrawal reversed.'
        );

        await Promise.all([
          loadDashboard(),
          loadWithdrawals(),
          loadTransactions(),
          loadUsers(),
        ]);
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setTransactionLoading(false);
      }
    };

  // ==========================================================
  // WITHDRAWAL DETAILS
  // ==========================================================

  const openWithdrawalDetails =
    async (
      withdrawal: Transaction
    ) => {
      setSelectedWithdrawal(
        withdrawal
      );

      setWithdrawalDetails(null);

      setWithdrawalDetailsOpen(
        true
      );

      setWithdrawalDetailsLoading(
        true
      );

      try {
        const response =
          await api.get(
            `/admin/withdrawals/${withdrawal.id}`
          );

        setWithdrawalDetails(
          response.data?.withdrawal ||
          response.data?.details ||
          response.data ||
          null
        );
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setWithdrawalDetailsLoading(
          false
        );
      }
    };

  // ==========================================================
  // GENERATE WITHDRAWAL CODE
  // ==========================================================

  const generateWithdrawalCode =
    async (
      withdrawal: Transaction
    ) => {
      const status =
        String(
          withdrawal.status || ''
        ).toUpperCase();

      if (status !== 'COMPLETED') {
        setError(
          'A withdrawal code can only be generated after the withdrawal is approved/completed.'
        );

        return;
      }

      if (
        !window.confirm(
          `Generate a withdrawal code for withdrawal #${withdrawal.id}?`
        )
      ) {
        return;
      }

      setWithdrawalCodeLoading(
        true
      );

      setGeneratedWithdrawalCode(
        ''
      );

      setWithdrawalCodeOpen(
        true
      );

      try {
        const response =
          await api.post(
            `/admin/withdrawals/${withdrawal.id}/code`
          );

        const code =
          response.data?.code ||
          response.data?.withdrawalCode ||
          response.data?.data?.code ||
          response.data?.data?.withdrawalCode ||
          '';

        if (code) {
          setGeneratedWithdrawalCode(
            String(code)
          );

          setSuccess(
            response.data?.message ||
            'Withdrawal code generated successfully.'
          );
        } else {
          setSuccess(
            response.data?.message ||
            'Withdrawal code generated.'
          );
        }
      } catch (err) {
        setWithdrawalCodeOpen(
          false
        );

        setError(
          getErrorMessage(err)
        );
      } finally {
        setWithdrawalCodeLoading(
          false
        );
      }
    };

  // ==========================================================
  // INVESTMENT CREATE
  // ==========================================================

  const openInvestmentCreate =
    () => {
      setEditingInvestmentPlan(
        null
      );

      setInvestmentForm({
        ...emptyInvestmentPlan,
      });

      setInvestmentDialogOpen(
        true
      );
    };

  // ==========================================================
  // INVESTMENT EDIT
  // ==========================================================

  const openInvestmentEdit =
    (
      plan: InvestmentPlan
    ) => {
      setEditingInvestmentPlan(
        plan
      );

      setInvestmentForm({
        name:
          plan.name || '',
        description:
          plan.description || '',
        minimumAmount:
          String(
            plan.minimumAmount ?? ''
          ),
        maximumAmount:
          plan.maximumAmount ===
            null ||
          plan.maximumAmount ===
            undefined
            ? ''
            : String(
                plan.maximumAmount
              ),
        roiPercent:
          String(
            plan.roiPercent ?? ''
          ),
        durationDays:
          String(
            plan.durationDays ?? 30
          ),
        status:
          plan.status ||
          'ACTIVE',
      });

      setInvestmentDialogOpen(
        true
      );
    };

  // ==========================================================
  // SAVE INVESTMENT
  // ==========================================================

  const saveInvestmentPlan =
    async () => {
      const minimum =
        Number(
          investmentForm.minimumAmount
        );

      const maximum =
        investmentForm.maximumAmount ===
        ''
          ? null
          : Number(
              investmentForm.maximumAmount
            );

      const roi =
        Number(
          investmentForm.roiPercent
        );

      const duration =
        Number(
          investmentForm.durationDays
        );

      if (
        !investmentForm.name.trim()
      ) {
        setError(
          'Investment plan name is required.'
        );

        return;
      }

      if (
        !Number.isFinite(minimum) ||
        minimum < 0
      ) {
        setError(
          'Minimum amount is invalid.'
        );

        return;
      }

      if (
        maximum !== null &&
        (
          !Number.isFinite(maximum) ||
          maximum < minimum
        )
      ) {
        setError(
          'Maximum amount must be greater than or equal to minimum amount.'
        );

        return;
      }

      if (
        !Number.isFinite(roi) ||
        roi < 0
      ) {
        setError(
          'ROI is invalid.'
        );

        return;
      }

      if (
        !Number.isInteger(duration) ||
        duration <= 0
      ) {
        setError(
          'Duration must be a positive number.'
        );

        return;
      }

      setInvestmentLoading(
        true
      );

      try {
        const payload = {
          name:
            investmentForm.name.trim(),
          description:
            investmentForm.description.trim(),
          minimumAmount:
            minimum,
          maximumAmount:
            maximum,
          roiPercent:
            roi,
          durationDays:
            duration,
          status:
            investmentForm.status,
        };

        const response =
          editingInvestmentPlan
            ? await api.patch(
                `/admin/investment-plans/${editingInvestmentPlan.id}`,
                payload
              )
            : await api.post(
                '/admin/investment-plans',
                payload
              );

        setSuccess(
          response.data?.message ||
          'Investment plan saved.'
        );

        setInvestmentDialogOpen(
          false
        );

        await Promise.all([
          loadInvestmentPlans(),
          loadDashboard(),
        ]);
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setInvestmentLoading(
          false
        );
      }
    };

  // ==========================================================
  // DELETE INVESTMENT
  // ==========================================================

  const deleteInvestmentPlan =
    async (
      plan: InvestmentPlan
    ) => {
      if (
        !window.confirm(
          `Delete investment plan "${plan.name}"?`
        )
      ) {
        return;
      }

      try {
        const response =
          await api.delete(
            `/admin/investment-plans/${plan.id}`
          );

        setSuccess(
          response.data?.message ||
          'Investment plan deleted.'
        );

        await Promise.all([
          loadInvestmentPlans(),
          loadDashboard(),
        ]);
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      }
    };

  // ==========================================================
  // SIGNAL CREATE
  // ==========================================================

  const openSignalCreate =
    () => {
      setEditingSignalPlan(
        null
      );

      setSignalForm({
        ...emptySignalPlan,
      });

      setSignalDialogOpen(
        true
      );
    };

  // ==========================================================
  // SIGNAL EDIT
  // ==========================================================

  const openSignalEdit =
    (
      plan: SignalPlan
    ) => {
      setEditingSignalPlan(
        plan
      );

      setSignalForm({
        name:
          plan.name || '',
        description:
          plan.description || '',
        strength:
          String(
            plan.strength ?? 50
          ),
        accuracyPercent:
          String(
            plan.accuracyPercent ?? 0
          ),
        durationDays:
          String(
            plan.durationDays ?? 30
          ),
        price:
          String(
            plan.price ?? 0
          ),
        currency:
          plan.currency || 'USD',
        status:
          plan.status || 'ACTIVE',
      });

      setSignalDialogOpen(
        true
      );
    };

  // ==========================================================
  // SAVE SIGNAL
  // ==========================================================

  const saveSignalPlan =
    async () => {
      const strength =
        Number(
          signalForm.strength
        );

      const accuracy =
        Number(
          signalForm.accuracyPercent
        );

      const duration =
        Number(
          signalForm.durationDays
        );

      const price =
        Number(
          signalForm.price
        );

      if (
        !signalForm.name.trim()
      ) {
        setError(
          'Signal plan name is required.'
        );

        return;
      }

      if (
        !Number.isFinite(strength) ||
        strength < 0 ||
        strength > 100
      ) {
        setError(
          'Signal strength must be between 0 and 100.'
        );

        return;
      }

      if (
        !Number.isFinite(accuracy) ||
        accuracy < 0 ||
        accuracy > 100
      ) {
        setError(
          'Accuracy must be between 0 and 100.'
        );

        return;
      }

      if (
        !Number.isInteger(duration) ||
        duration <= 0
      ) {
        setError(
          'Duration must be a positive number.'
        );

        return;
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        setError(
          'Signal price is invalid.'
        );

        return;
      }

      setSignalLoading(
        true
      );

      try {
        const payload = {
          name:
            signalForm.name.trim(),
          description:
            signalForm.description.trim(),
          strength,
          accuracyPercent:
            accuracy,
          durationDays:
            duration,
          price,
          currency:
            signalForm.currency
              .trim()
              .toUpperCase(),
          status:
            signalForm.status,
        };

        const response =
          editingSignalPlan
            ? await api.patch(
                `/admin/signal-plans/${editingSignalPlan.id}`,
                payload
              )
            : await api.post(
                '/admin/signal-plans',
                payload
              );

        setSuccess(
          response.data?.message ||
          'Signal plan saved.'
        );

        setSignalDialogOpen(
          false
        );

        await loadSignalPlans();
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setSignalLoading(
          false
        );
      }
    };

  // ==========================================================
  // DELETE SIGNAL
  // ==========================================================

  const deleteSignalPlan =
    async (
      plan: SignalPlan
    ) => {
      if (
        !window.confirm(
          `Delete signal plan "${plan.name}"?`
        )
      ) {
        return;
      }

      try {
        const response =
          await api.delete(
            `/admin/signal-plans/${plan.id}`
          );

        setSuccess(
          response.data?.message ||
          'Signal plan deleted.'
        );

        await loadSignalPlans();
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      }
    };

  // ==========================================================
  // USER SIGNAL
  // ==========================================================

  const openUserSignal =
    async (
      user: User
    ) => {
      setUserSignalUser(user);

      setUserSignalDialogOpen(
        true
      );

      setUserSignalLoading(
        true
      );

      try {
        const response =
          await api.get(
            `/admin/users/${user.id}/signal`
          );

        const signal =
          response.data?.signal ||
          null;

        setUserSignal(
          signal
        );

        setUserSignalPlanId(
          signal?.plan?.id
            ? String(
                signal.plan.id
              )
            : ''
        );

        setUserSignalStrength(
          String(
            signal?.strength ?? 50
          )
        );

        setUserSignalEnabled(
          signal?.enabled ?? true
        );

        setUserSignalNote(
          signal?.note || ''
        );
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setUserSignalLoading(
          false
        );
      }
    };

  // ==========================================================
  // SAVE USER SIGNAL
  // ==========================================================

  const saveUserSignal =
    async () => {
      if (!userSignalUser) {
        return;
      }

      const strength =
        Number(
          userSignalStrength
        );

      if (
        !Number.isFinite(strength) ||
        strength < 0 ||
        strength > 100
      ) {
        setError(
          'Signal strength must be between 0 and 100.'
        );

        return;
      }

      setUserSignalLoading(
        true
      );

      try {
        const response =
          await api.patch(
            `/admin/users/${userSignalUser.id}/signal`,
            {
              signalPlanId:
                userSignalPlanId
                  ? Number(
                      userSignalPlanId
                    )
                  : null,
              strength,
              enabled:
                userSignalEnabled,
              note:
                userSignalNote,
            }
          );

        setSuccess(
          response.data?.message ||
          'User signal updated.'
        );

        setUserSignal(
          response.data?.signal ||
          null
        );

        setUserSignalDialogOpen(
          false
        );
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setUserSignalLoading(
          false
        );
      }
    };

  // ==========================================================
  // PAYMENT CREATE
  // ==========================================================

  const openPaymentCreate =
    () => {
      setEditingPaymentMethod(
        null
      );

      setPaymentForm({
        ...emptyPaymentMethod,
      });

      setPaymentDialogOpen(
        true
      );
    };

  // ==========================================================
  // PAYMENT EDIT
  // ==========================================================

  const openPaymentEdit =
    (
      method: PaymentMethod
    ) => {
      setEditingPaymentMethod(
        method
      );

      setPaymentForm({
        name:
          method.name || '',
        type:
          method.type || 'BANK',
        currency:
          method.currency || 'USD',
        details:
          method.details || '',
        accountName:
          method.accountName || '',
        accountNumber:
          method.accountNumber || '',
        bankName:
          method.bankName || '',
        walletAddress:
          method.walletAddress || '',
        instructions:
          method.instructions || '',
        status:
          method.status ||
          'ACTIVE',
      });

      setPaymentDialogOpen(
        true
      );
    };

  // ==========================================================
  // SAVE PAYMENT
  // ==========================================================

  const savePaymentMethod =
    async () => {
      if (
        !paymentForm.name.trim()
      ) {
        setError(
          'Payment method name is required.'
        );

        return;
      }

      setPaymentLoading(
        true
      );

      try {
        const payload = {
          name:
            paymentForm.name.trim(),
          type:
            paymentForm.type
              .trim()
              .toUpperCase(),
          currency:
            paymentForm.currency
              .trim()
              .toUpperCase(),
          details:
            paymentForm.details.trim(),
          accountName:
            paymentForm.accountName.trim(),
          accountNumber:
            paymentForm.accountNumber.trim(),
          bankName:
            paymentForm.bankName.trim(),
          walletAddress:
            paymentForm.walletAddress.trim(),
          instructions:
            paymentForm.instructions.trim(),
          status:
            paymentForm.status,
        };

        const response =
          editingPaymentMethod
            ? await api.patch(
                `/admin/payment-methods/${editingPaymentMethod.id}`,
                payload
              )
            : await api.post(
                '/admin/payment-methods',
                payload
              );

        setSuccess(
          response.data?.message ||
          'Payment method saved.'
        );

        setPaymentDialogOpen(
          false
        );

        await loadPaymentMethods();
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      } finally {
        setPaymentLoading(
          false
        );
      }
    };

  // ==========================================================
  // DELETE PAYMENT
  // ==========================================================

  const deletePaymentMethod =
    async (
      method: PaymentMethod
    ) => {
      if (
        !window.confirm(
          `Delete payment method "${method.name}"?`
        )
      ) {
        return;
      }

      try {
        const response =
          await api.delete(
            `/admin/payment-methods/${method.id}`
          );

        setSuccess(
          response.data?.message ||
          'Payment method deleted.'
        );

        await loadPaymentMethods();
      } catch (err) {
        setError(
          getErrorMessage(err)
        );
      }
    };

  // ==========================================================
  // FILTER USERS
  // ==========================================================

  const filteredUsers =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return users;
      }

      return users.filter(
        (user) =>
          String(user.id).includes(
            value
          ) ||
          String(
            user.email || ''
          )
            .toLowerCase()
            .includes(value) ||
          String(
            user.firstName || ''
          )
            .toLowerCase()
            .includes(value) ||
          String(
            user.lastName || ''
          )
            .toLowerCase()
            .includes(value) ||
          String(
            user.username || ''
          )
            .toLowerCase()
            .includes(value)
      );
    }, [
      users,
      search,
    ]);

  // ==========================================================
  // STAT CARD
  // ==========================================================

  const StatCard = ({
    title,
    value,
    icon,
  }: {
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
  }) => (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {title}
            </Typography>

            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ mt: 1 }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              backgroundColor:
                'action.hover',
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  const renderDashboard = () => {
    if (!dashboard) {
      return (
        <Paper sx={{ p: 4 }}>
          <Typography>
            No dashboard data available.
          </Typography>
        </Paper>
      );
    }

    return (
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
          >
            Admin Dashboard
          </Typography>

          <Typography
            color="text.secondary"
          >
            Overview of Global Digital Market.
          </Typography>
        </Box>

        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <StatCard
              title="Total Users"
              value={
                dashboard.totalUsers
              }
              icon={<Groups />}
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <StatCard
              title="Active Users"
              value={
                dashboard.activeUsers
              }
              icon={<Person />}
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <StatCard
              title="Accounts"
              value={
                dashboard.totalAccounts
              }
              icon={
                <AccountBalance />
              }
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <StatCard
              title="Transactions"
              value={
                dashboard.totalTransactions
              }
              icon={<Assessment />}
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <StatCard
              title="Total Balance"
              value={formatMoney(
                dashboard.totalAccountBalance
              )}
              icon={
                <AttachMoney />
              }
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <StatCard
              title="Completed Deposits"
              value={formatMoney(
                dashboard.completedDeposits
              )}
              icon={
                <AccountBalanceWallet />
              }
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <StatCard
              title="Completed Withdrawals"
              value={formatMoney(
                dashboard.completedWithdrawals
              )}
              icon={<Payments />}
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <StatCard
              title="Pending KYC"
              value={
                dashboard.pendingKyc
              }
              icon={
                <VerifiedUser />
              }
            />
          </Grid>
        </Grid>

        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            md={4}
          >
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Pending Activity
                </Typography>

                <Stack
                  spacing={1.5}
                  sx={{ mt: 2 }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography>
                      Transactions
                    </Typography>

                    <Chip
                      label={
                        dashboard.pendingTransactions
                      }
                      color="warning"
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography>
                      Deposits
                    </Typography>

                    <Chip
                      label={
                        dashboard.pendingDeposits
                      }
                      color="warning"
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography>
                      Withdrawals
                    </Typography>

                    <Chip
                      label={
                        dashboard.pendingWithdrawals
                      }
                      color="warning"
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid
            item
            xs={12}
            md={4}
          >
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Investment Plans
                </Typography>

                <Typography
                  variant="h3"
                  fontWeight={800}
                  sx={{ mt: 2 }}
                >
                  {
                    dashboard.activeInvestmentPlans
                  }
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  Active plans
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid
            item
            xs={12}
            md={4}
          >
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Quick Actions
                </Typography>

                <Stack
                  spacing={1}
                  sx={{ mt: 2 }}
                >
                  <Button
                    variant="outlined"
                    onClick={() =>
                      selectSection(
                        'users'
                      )
                    }
                  >
                    Manage Users
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() =>
                      selectSection(
                        'funding'
                      )
                    }
                  >
                    Credit / Debit Accounts
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() =>
                      selectSection(
                        'withdrawals'
                      )
                    }
                  >
                    Review Withdrawals
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() =>
                      selectSection(
                        'kyc'
                      )
                    }
                  >
                    Review KYC
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    );
  };

  // ==========================================================
  // USERS
  // ==========================================================

  const renderUsers = () => (
    <Stack spacing={2}>
      <Stack
        direction={{
          xs: 'column',
          sm: 'row',
        }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
          >
            Users
          </Typography>

          <Typography
            color="text.secondary"
          >
            Manage user accounts and balances.
          </Typography>
        </Box>

        <TextField
          size="small"
          label="Search users"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />
      </Stack>

      <TableContainer
        component={Paper}
        sx={{
          overflowX: 'auto',
        }}
      >
        <Table
          sx={{
            minWidth: 900,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredUsers.map(
              (user) => (
                <TableRow
                  key={user.id}
                >
                  <TableCell>
                    {user.id}
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={700}
                    >
                      {[
                        user.firstName,
                        user.lastName,
                      ]
                        .filter(Boolean)
                        .join(' ') ||
                        user.username ||
                        'User'}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {user.username ||
                        ''}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {user.email}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        user.status ||
                        'UNKNOWN'
                      }
                      color={statusColor(
                        user.status
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      user.account
                        ?.balance,
                      user.account
                        ?.currency ||
                        user.preferredCurrency ||
                        'USD'
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      flexWrap="wrap"
                      gap={0.5}
                    >
                      <Button
                        size="small"
                        onClick={() =>
                          openUser(user)
                        }
                      >
                        View
                      </Button>

                      <Button
                        size="small"
                        color="success"
                        onClick={() =>
                          openMoneyDialog(
                            user,
                            'fund'
                          )
                        }
                      >
                        Credit
                      </Button>

                      <Button
                        size="small"
                        color="warning"
                        onClick={() =>
                          openMoneyDialog(
                            user,
                            'debit'
                          )
                        }
                      >
                        Debit
                      </Button>

                      <Button
                        size="small"
                        onClick={() =>
                          openUserSignal(
                            user
                          )
                        }
                      >
                        Signal
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            )}

            {filteredUsers.length ===
              0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );

  // ==========================================================
  // ACCOUNTS
  // ==========================================================

  const renderAccounts = () => (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
        >
          Accounts
        </Typography>

        <Typography
          color="text.secondary"
        >
          Review user trading and wallet accounts.
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          overflowX: 'auto',
        }}
      >
        <Table
          sx={{
            minWidth: 900,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>
                Account Number
              </TableCell>
              <TableCell>
                Currency
              </TableCell>
              <TableCell>
                Balance
              </TableCell>
              <TableCell>
                Available
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users
              .filter(
                (user) =>
                  Boolean(
                    user.account
                  )
              )
              .map(
                (user) => (
                  <TableRow
                    key={user.id}
                  >
                    <TableCell>
                      <Typography
                        fontWeight={700}
                      >
                        {[
                          user.firstName,
                          user.lastName,
                        ]
                          .filter(Boolean)
                          .join(' ') ||
                          user.username ||
                          user.email}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {user.email}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {user.account
                        ?.accountNumber ||
                        '—'}
                    </TableCell>

                    <TableCell>
                      {user.account
                        ?.currency ||
                        'USD'}
                    </TableCell>

                    <TableCell>
                      {formatMoney(
                        user.account
                          ?.balance,
                        user.account
                          ?.currency ||
                          'USD'
                      )}
                    </TableCell>

                    <TableCell>
                      {formatMoney(
                        user.account
                          ?.availableBalance,
                        user.account
                          ?.currency ||
                          'USD'
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          user.account
                            ?.status ||
                          'ACTIVE'
                        }
                        color={statusColor(
                          user.account
                            ?.status ||
                            'ACTIVE'
                        )}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Stack
                        direction="row"
                        justifyContent="flex-end"
                        spacing={1}
                      >
                        <Button
                          size="small"
                          color="success"
                          onClick={() =>
                            openMoneyDialog(
                              user,
                              'fund'
                            )
                          }
                        >
                          Credit
                        </Button>

                        <Button
                          size="small"
                          color="warning"
                          onClick={() =>
                            openMoneyDialog(
                              user,
                              'debit'
                            )
                          }
                        >
                          Debit
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              )}

            {users.filter(
              (user) =>
                Boolean(
                  user.account
                )
            ).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                >
                  No accounts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );

  // ==========================================================
  // TRANSACTION TABLE
  // ==========================================================

  const transactionTable = (
    rows: Transaction[],
    withdrawalMode = false
  ) => (
    <TableContainer
      component={Paper}
      sx={{
        overflowX: 'auto',
      }}
    >
      <Table
        sx={{
          minWidth: 1050,
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">
              Action
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map(
            (transaction) => {
              const status =
                String(
                  transaction.status ||
                  ''
                ).toUpperCase();

              const pending =
                status === 'PENDING' ||
                status === 'PROCESSING';

              return (
                <TableRow
                  key={
                    transaction.id
                  }
                >
                  <TableCell>
                    {
                      transaction.id
                    }
                  </TableCell>

                  <TableCell>
                    {
                      transaction.user
                        ?.firstName
                    }{' '}
                    {
                      transaction.user
                        ?.lastName
                    }

                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      {
                        transaction
                          .user
                          ?.email
                      }
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        transaction.transactionType ||
                        'UNKNOWN'
                      }
                    />
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      transaction.amount,
                      transaction.currency ||
                        'USD'
                    )}
                  </TableCell>

                  <TableCell>
                    {
                      transaction.paymentMethod ||
                      '—'
                    }
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        transaction.status ||
                        'UNKNOWN'
                      }
                      color={statusColor(
                        transaction.status
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    {formatDate(
                      transaction.createdAt
                    )}
                  </TableCell>

                  <TableCell align="right">
                    {withdrawalMode ? (
                      <Stack
                        direction="row"
                        justifyContent="flex-end"
                        flexWrap="wrap"
                        gap={0.5}
                      >
                        <Button
                          size="small"
                          onClick={() =>
                            openWithdrawalDetails(
                              transaction
                            )
                          }
                        >
                          View
                        </Button>

                        {pending && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              startIcon={
                                <CheckCircle />
                              }
                              onClick={() =>
                                approveWithdrawal(
                                  transaction
                                )
                              }
                              disabled={
                                transactionLoading
                              }
                            >
                              Approve
                            </Button>

                            <Button
                              size="small"
                              color="error"
                              onClick={() =>
                                rejectWithdrawal(
                                  transaction
                                )
                              }
                              disabled={
                                transactionLoading
                              }
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {status ===
                          'COMPLETED' && (
                          <>
                            <Button
                              size="small"
                              startIcon={
                                <Code />
                              }
                              onClick={() =>
                                generateWithdrawalCode(
                                  transaction
                                )
                              }
                            >
                              Generate Code
                            </Button>

                            <Button
                              size="small"
                              color="warning"
                              onClick={() =>
                                reverseWithdrawal(
                                  transaction
                                )
                              }
                              disabled={
                                transactionLoading
                              }
                            >
                              Reverse
                            </Button>
                          </>
                        )}
                      </Stack>
                    ) : (
                      <Button
                        size="small"
                        onClick={() =>
                          openTransactionStatus(
                            transaction
                          )
                        }
                      >
                        Update
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            }
          )}

          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                align="center"
              >
                No transactions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // ==========================================================
  // TRANSACTIONS
  // ==========================================================

  const renderTransactions =
    () => (
      <Stack spacing={2}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
          >
            Transactions
          </Typography>

          <Typography
            color="text.secondary"
          >
            Review and update transactions.
          </Typography>
        </Box>

        {transactionTable(
          transactions
        )}
      </Stack>
    );

  // ==========================================================
  // DEPOSITS
  // ==========================================================

  const renderDeposits = () => (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
        >
          Deposits
        </Typography>

        <Typography
          color="text.secondary"
        >
          Review user deposit requests.
        </Typography>
      </Box>

      {transactionTable(
        deposits
      )}
    </Stack>
  );

  // ==========================================================
  // WITHDRAWALS
  // ==========================================================

  const renderWithdrawals =
    () => (
      <Stack spacing={2}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
          >
            Withdrawals
          </Typography>

          <Typography
            color="text.secondary"
          >
            Approve, reject, reverse and generate withdrawal codes.
          </Typography>
        </Box>

        <Alert severity="info">
          Pending withdrawals can be approved or rejected.
          Completed withdrawals can have a code generated or be reversed.
        </Alert>

        {transactionTable(
          withdrawals,
          true
        )}
      </Stack>
    );

  // ==========================================================
  // WITHDRAWAL CODE
  // ==========================================================

  const renderWithdrawalCode =
    () => (
      <Stack spacing={2}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
          >
            Withdrawal Generating Code
          </Typography>

          <Typography
            color="text.secondary"
          >
            Generate codes for approved/completed withdrawals.
          </Typography>
        </Box>

        <Alert severity="info">
          Only completed withdrawals can generate a withdrawal code.
        </Alert>

        {transactionTable(
          withdrawals.filter(
            (item) =>
              String(
                item.status || ''
              ).toUpperCase() ===
              'COMPLETED'
          ),
          true
        )}
      </Stack>
    );

  // ==========================================================
  // KYC
  // ==========================================================

  const renderKyc = () => (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
        >
          KYC Requests
        </Typography>

        <Typography
          color="text.secondary"
        >
          Review submitted identity documents.
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          overflowX: 'auto',
        }}
      >
        <Table
          sx={{
            minWidth: 850,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Document</TableCell>
              <TableCell>
                Document Number
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Document</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {kycRequests.map(
              (request) => (
                <TableRow
                  key={request.id}
                >
                  <TableCell>
                    <Typography
                      fontWeight={700}
                    >
                      {
                        request.user
                          ?.firstName
                      }{' '}
                      {
                        request.user
                          ?.lastName
                      }
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {
                        request.user
                          ?.email
                      }
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {
                      request.documentType ||
                      '—'
                    }
                  </TableCell>

                  <TableCell>
                    {
                      request.documentNumber ||
                      '—'
                    }
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        request.status ||
                        'UNKNOWN'
                      }
                      color={statusColor(
                        request.status
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    {formatDate(
                      request.createdAt
                    )}
                  </TableCell>

                  <TableCell>
                    {request.documentUrl ? (
                      <Button
                        size="small"
                        component="a"
                        href={
                          request.documentUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              )
            )}

            {kycRequests.length ===
              0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                >
                  No KYC requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );

  // ==========================================================
  // INVESTMENT PLANS
  // ==========================================================

  const renderInvestmentPlans =
    () => (
      <Stack spacing={2}>
        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
            >
              Investment Plans
            </Typography>

            <Typography
              color="text.secondary"
            >
              Create and manage investment plans.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={
              openInvestmentCreate
            }
          >
            Add Plan
          </Button>
        </Stack>

        <Grid
          container
          spacing={2}
        >
          {investmentPlans.map(
            (plan) => (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={plan.id}
              >
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="h6"
                          fontWeight={800}
                        >
                          {plan.name}
                        </Typography>

                        <Chip
                          size="small"
                          label={
                            plan.status
                          }
                          color={statusColor(
                            plan.status
                          )}
                        />
                      </Stack>

                      <Typography
                        color="text.secondary"
                      >
                        {
                          plan.description ||
                          'No description'
                        }
                      </Typography>

                      <Divider />

                      <Typography>
                        Minimum:{' '}
                        <strong>
                          {formatMoney(
                            plan.minimumAmount
                          )}
                        </strong>
                      </Typography>

                      <Typography>
                        Maximum:{' '}
                        <strong>
                          {plan.maximumAmount ===
                            null ||
                          plan.maximumAmount ===
                            undefined
                            ? 'No limit'
                            : formatMoney(
                                plan.maximumAmount
                              )}
                        </strong>
                      </Typography>

                      <Typography>
                        ROI:{' '}
                        <strong>
                          {
                            plan.roiPercent
                          }%
                        </strong>
                      </Typography>

                      <Typography>
                        Duration:{' '}
                        <strong>
                          {
                            plan.durationDays
                          } days
                        </strong>
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                      >
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={
                            <Edit />
                          }
                          onClick={() =>
                            openInvestmentEdit(
                              plan
                            )
                          }
                        >
                          Edit
                        </Button>

                        <Button
                          fullWidth
                          color="error"
                          variant="outlined"
                          startIcon={
                            <Delete />
                          }
                          onClick={() =>
                            deleteInvestmentPlan(
                              plan
                            )
                          }
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}

          {investmentPlans.length ===
            0 && (
            <Grid
              item
              xs={12}
            >
              <Paper sx={{ p: 4 }}>
                No investment plans found.
              </Paper>
            </Grid>
          )}
        </Grid>
      </Stack>
    );

  // ==========================================================
  // SIGNAL PLANS
  // ==========================================================

  const renderSignalPlans =
    () => (
      <Stack spacing={2}>
        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
            >
              Signal Plans
            </Typography>

            <Typography
              color="text.secondary"
            >
              Manage signal packages.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={
              openSignalCreate
            }
          >
            Add Signal Plan
          </Button>
        </Stack>

        <Grid
          container
          spacing={2}
        >
          {signalPlans.map(
            (plan) => (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={plan.id}
              >
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="h6"
                          fontWeight={800}
                        >
                          {plan.name}
                        </Typography>

                        <Chip
                          size="small"
                          label={
                            plan.status
                          }
                          color={statusColor(
                            plan.status
                          )}
                        />
                      </Stack>

                      <Typography
                        color="text.secondary"
                      >
                        {
                          plan.description ||
                          'No description'
                        }
                      </Typography>

                      <Typography>
                        Strength:{' '}
                        <strong>
                          {
                            plan.strength
                          }%
                        </strong>
                      </Typography>

                      <Typography>
                        Accuracy:{' '}
                        <strong>
                          {
                            plan.accuracyPercent
                          }%
                        </strong>
                      </Typography>

                      <Typography>
                        Duration:{' '}
                        <strong>
                          {
                            plan.durationDays
                          } days
                        </strong>
                      </Typography>

                      <Typography>
                        Price:{' '}
                        <strong>
                          {formatMoney(
                            plan.price,
                            plan.currency
                          )}
                        </strong>
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                      >
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={
                            <Edit />
                          }
                          onClick={() =>
                            openSignalEdit(
                              plan
                            )
                          }
                        >
                          Edit
                        </Button>

                        <Button
                          fullWidth
                          color="error"
                          variant="outlined"
                          startIcon={
                            <Delete />
                          }
                          onClick={() =>
                            deleteSignalPlan(
                              plan
                            )
                          }
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}

          {signalPlans.length ===
            0 && (
            <Grid
              item
              xs={12}
            >
              <Paper sx={{ p: 4 }}>
                No signal plans found.
              </Paper>
            </Grid>
          )}
        </Grid>
      </Stack>
    );

  // ==========================================================
  // PAYMENT METHODS
  // ==========================================================

  const renderPaymentMethods =
    () => (
      <Stack spacing={2}>
        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
            >
              Payment Methods
            </Typography>

            <Typography
              color="text.secondary"
            >
              Configure payment methods shown to users.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={
              openPaymentCreate
            }
          >
            Add Payment Method
          </Button>
        </Stack>

        <Grid
          container
          spacing={2}
        >
          {paymentMethods.map(
            (method) => (
              <Grid
                item
                xs={12}
                md={6}
                lg={4}
                key={method.id}
              >
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="h6"
                          fontWeight={800}
                        >
                          {method.name}
                        </Typography>

                        <Chip
                          size="small"
                          label={
                            method.status
                          }
                          color={statusColor(
                            method.status
                          )}
                        />
                      </Stack>

                      <Typography>
                        Type:{' '}
                        <strong>
                          {
                            method.type
                          }
                        </strong>
                      </Typography>

                      <Typography>
                        Currency:{' '}
                        <strong>
                          {
                            method.currency
                          }
                        </strong>
                      </Typography>

                      {method.bankName && (
                        <Typography>
                          Bank:{' '}
                          <strong>
                            {
                              method.bankName
                            }
                          </strong>
                        </Typography>
                      )}

                      {method.accountName && (
                        <Typography>
                          Account Name:{' '}
                          <strong>
                            {
                              method.accountName
                            }
                          </strong>
                        </Typography>
                      )}

                      {method.accountNumber && (
                        <Typography>
                          Account Number:{' '}
                          <strong>
                            {
                              method.accountNumber
                            }
                          </strong>
                        </Typography>
                      )}

                      {method.walletAddress && (
                        <Typography
                          sx={{
                            wordBreak:
                              'break-word',
                          }}
                        >
                          Wallet:{' '}
                          <strong>
                            {
                              method.walletAddress
                            }
                          </strong>
                        </Typography>
                      )}

                      {method.details && (
                        <Typography
                          color="text.secondary"
                        >
                          {
                            method.details
                          }
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        spacing={1}
                      >
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={
                            <Edit />
                          }
                          onClick={() =>
                            openPaymentEdit(
                              method
                            )
                          }
                        >
                          Edit
                        </Button>

                        <Button
                          fullWidth
                          color="error"
                          variant="outlined"
                          startIcon={
                            <Delete />
                          }
                          onClick={() =>
                            deletePaymentMethod(
                              method
                            )
                          }
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}

          {paymentMethods.length ===
            0 && (
            <Grid
              item
              xs={12}
            >
              <Paper sx={{ p: 4 }}>
                No payment methods found.
              </Paper>
            </Grid>
          )}
        </Grid>
      </Stack>
    );

  // ==========================================================
  // FUNDING
  // ==========================================================

  const renderFunding = () => (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
        >
          User Account Funding
        </Typography>

        <Typography
          color="text.secondary"
        >
          Credit or debit user accounts.
        </Typography>
      </Box>

      <Alert severity="info">
        Credit and Debit use the existing admin
        funding endpoints.
      </Alert>

      <TableContainer
        component={Paper}
        sx={{
          overflowX: 'auto',
        }}
      >
        <Table
          sx={{
            minWidth: 850,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Account</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredUsers.map(
              (user) => (
                <TableRow
                  key={user.id}
                >
                  <TableCell>
                    <Typography
                      fontWeight={700}
                    >
                      {[
                        user.firstName,
                        user.lastName,
                      ]
                        .filter(Boolean)
                        .join(' ') ||
                        user.username ||
                        'User'}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {user.email}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {
                      user.account
                        ?.accountNumber ||
                      'No account'
                    }
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      user.account
                        ?.balance,
                      user.account
                        ?.currency ||
                        user.preferredCurrency ||
                        'USD'
                    )}
                  </TableCell>

                  <TableCell>
                    {
                      user.account
                        ?.currency ||
                      user.preferredCurrency ||
                      'USD'
                    }
                  </TableCell>

                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={1}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() =>
                          openMoneyDialog(
                            user,
                            'fund'
                          )
                        }
                      >
                        + Credit
                      </Button>

                      <Button
                        variant="contained"
                        color="warning"
                        onClick={() =>
                          openMoneyDialog(
                            user,
                            'debit'
                          )
                        }
                      >
                        − Debit
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            )}

            {filteredUsers.length ===
              0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );

  // ==========================================================
  // SETTINGS
  // ==========================================================

  const renderSettings = () => (
    <Stack spacing={2}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
        >
          Settings
        </Typography>

        <Typography
          color="text.secondary"
        >
          Administrative configuration.
        </Typography>
      </Box>

      <Alert severity="info">
        The backend router provided does not currently
        contain an admin settings endpoint. Therefore
        this section does not make fake save requests.
      </Alert>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography
              variant="h6"
              fontWeight={800}
            >
              API Configuration
            </Typography>

            <Typography>
              API:{' '}
              <strong>
                https://globalmarket-com.onrender.com/api
              </strong>
            </Typography>

            <Typography
              color="text.secondary"
            >
              Authentication is handled by the existing
              apiClient.ts using adminToken.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );

  // ==========================================================
  // CURRENT SECTION
  // ==========================================================

  const renderSection = () => {
    switch (section) {
      case 'users':
        return renderUsers();

      case 'accounts':
        return renderAccounts();

      case 'transactions':
        return renderTransactions();

      case 'deposits':
        return renderDeposits();

      case 'withdrawals':
        return renderWithdrawals();

      case 'kyc':
        return renderKyc();

      case 'investment-plans':
        return renderInvestmentPlans();

      case 'signal-plans':
        return renderSignalPlans();

      case 'payment-methods':
        return renderPaymentMethods();

      case 'funding':
        return renderFunding();

      case 'withdrawal-code':
        return renderWithdrawalCode();

      case 'settings':
        return renderSettings();

      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  // ==========================================================
  // SIDEBAR
  // ==========================================================

  const navigationItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <Assessment />,
    },
    {
      key: 'users',
      label: 'Users',
      icon: <Groups />,
    },
    {
      key: 'accounts',
      label: 'Accounts',
      icon: <AccountBalance />,
    },
    {
      key: 'transactions',
      label: 'Transactions',
      icon: <Assessment />,
    },
    {
      key: 'deposits',
      label: 'Deposits',
      icon: <AccountBalanceWallet />,
    },
    {
      key: 'withdrawals',
      label: 'Withdrawals',
      icon: <Payments />,
    },
    {
      key: 'kyc',
      label: 'KYC',
      icon: <VerifiedUser />,
    },
    {
      key: 'investment-plans',
      label: 'Investment Plans',
      icon: <Wallet />,
    },
    {
      key: 'signal-plans',
      label: 'Signal Plans',
      icon: <Assessment />,
    },
    {
      key: 'payment-methods',
      label: 'Payment Methods',
      icon: <CreditCard />,
    },
    {
      key: 'funding',
      label: 'User Account Funding',
      icon: <AttachMoney />,
    },
    {
      key: 'withdrawal-code',
      label: 'Withdrawal Generating Code',
      icon: <Key />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <Settings />,
    },
  ];

  const drawerWidth = 270;

  const sidebar = (
    <Box
      sx={{
        width: drawerWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 2.5,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={900}
        >
          Global Digital Market
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          Administration Panel
        </Typography>
      </Box>

      <Divider />

      <List
        sx={{
          px: 1,
          py: 1,
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {navigationItems.map(
          (item) => (
            <ListItemButton
              key={item.key}
              selected={
                section === item.key
              }
              onClick={() =>
                selectSection(
                  item.key
                )
              }
              sx={{
                borderRadius: 2,
                mb: 0.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 42,
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight:
                    section ===
                    item.key
                      ? 700
                      : 500,
                }}
              />
            </ListItemButton>
          )
        )}
      </List>

      <Divider />

      <Box sx={{ p: 1 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 42,
            }}
          >
            <Logout />
          </ListItemIcon>

          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontWeight: 700,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor:
          'background.default',
      }}
    >
      {/* ======================================================
          MOBILE DRAWER
      ====================================================== */}

      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() =>
            setMobileOpen(false)
          }
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
            },
          }}
        >
          {sidebar}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing:
                'border-box',
            },
          }}
        >
          {sidebar}
        </Drawer>
      )}

      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <Box
        sx={{
          ml: isMobile
            ? 0
            : `${drawerWidth}px`,
          minHeight: '100vh',
        }}
      >
        <AppBar
          position="sticky"
          color="inherit"
          elevation={1}
          sx={{
            zIndex: (muiTheme) =>
              muiTheme.zIndex.drawer +
              1,
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() =>
                  setMobileOpen(
                    true
                  )
                }
                sx={{
                  mr: 1,
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              sx={{
                flexGrow: 1,
                fontWeight: 800,
              }}
            >
              Administrator
            </Typography>

            <IconButton
              onClick={
                refreshData
              }
              disabled={loading}
              title="Refresh"
            >
              <Refresh />
            </IconButton>

            <IconButton
              onClick={logout}
              title="Logout"
            >
              <Logout />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container
          maxWidth="xl"
          sx={{
            py: 3,
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
              }}
              onClose={() =>
                setError('')
              }
            >
              {error}
            </Alert>
          )}

          {loading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent:
                  'center',
                py: 3,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {renderSection()}
        </Container>
      </Box>

      {/* ======================================================
          USER DETAILS
      ====================================================== */}

      <Dialog
        open={userDialogOpen}
        onClose={() =>
          setUserDialogOpen(false)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          User Details
        </DialogTitle>

        <DialogContent dividers>
          {userLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent:
                  'center',
                py: 5,
              }}
            >
              <CircularProgress />
            </Box>
          ) : selectedUser ? (
            <Stack spacing={3}>
              <Grid
                container
                spacing={2}
              >
                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Name
                  </Typography>

                  <Typography
                    fontWeight={700}
                  >
                    {
                      selectedUser.firstName
                    }{' '}
                    {
                      selectedUser.lastName
                    }
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Email
                  </Typography>

                  <Typography
                    fontWeight={700}
                  >
                    {
                      selectedUser.email
                    }
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Username
                  </Typography>

                  <Typography>
                    {
                      selectedUser.username ||
                      '—'
                    }
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Phone
                  </Typography>

                  <Typography>
                    {
                      selectedUser.phone ||
                      '—'
                    }
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Country
                  </Typography>

                  <Typography>
                    {
                      selectedUser.country ||
                      '—'
                    }
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Status
                  </Typography>

                  <Chip
                    label={
                      selectedUser.status ||
                      'UNKNOWN'
                    }
                    color={statusColor(
                      selectedUser.status
                    )}
                  />
                </Grid>
              </Grid>

              <Divider />

              <Typography
                variant="h6"
                fontWeight={800}
              >
                Account
              </Typography>

              {selectedUser.account ? (
                <Grid
                  container
                  spacing={2}
                >
                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Typography
                      color="text.secondary"
                    >
                      Account Number
                    </Typography>

                    <Typography
                      fontWeight={700}
                    >
                      {
                        selectedUser
                          .account
                          .accountNumber ||
                        '—'
                      }
                    </Typography>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Typography
                      color="text.secondary"
                    >
                      Currency
                    </Typography>

                    <Typography>
                      {
                        selectedUser
                          .account
                          .currency ||
                        'USD'
                      }
                    </Typography>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Typography
                      color="text.secondary"
                    >
                      Balance
                    </Typography>

                    <Typography
                      variant="h5"
                      fontWeight={800}
                    >
                      {formatMoney(
                        selectedUser
                          .account
                          .balance,
                        selectedUser
                          .account
                          .currency ||
                          'USD'
                      )}
                    </Typography>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Typography
                      color="text.secondary"
                    >
                      Available Balance
                    </Typography>

                    <Typography
                      variant="h6"
                      fontWeight={700}
                    >
                      {formatMoney(
                        selectedUser
                          .account
                          .availableBalance,
                        selectedUser
                          .account
                          .currency ||
                          'USD'
                      )}
                    </Typography>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Typography
                      color="text.secondary"
                    >
                      Deposits
                    </Typography>

                    <Typography>
                      {formatMoney(
                        selectedUser
                          .account
                          .deposit,
                        selectedUser
                          .account
                          .currency ||
                          'USD'
                      )}
                    </Typography>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Typography
                      color="text.secondary"
                    >
                      Profits
                    </Typography>

                    <Typography>
                      {formatMoney(
                        selectedUser
                          .account
                          .profits,
                        selectedUser
                          .account
                          .currency ||
                          'USD'
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="warning">
                  This user does not have an account.
                </Alert>
              )}

              <Divider />

              <Typography
                variant="h6"
                fontWeight={800}
              >
                User Controls
              </Typography>

              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
              >
                <Button
                  color="success"
                  variant="contained"
                  onClick={() =>
                    changeUserStatus(
                      selectedUser,
                      'active'
                    )
                  }
                >
                  Activate
                </Button>

                <Button
                  color="warning"
                  variant="contained"
                  onClick={() =>
                    changeUserStatus(
                      selectedUser,
                      'suspended'
                    )
                  }
                >
                  Suspend
                </Button>

                <Button
                  color="error"
                  variant="contained"
                  startIcon={<Block />}
                  onClick={() =>
                    changeUserStatus(
                      selectedUser,
                      'blocked'
                    )
                  }
                >
                  Block
                </Button>

                <Button
                  color="error"
                  variant="outlined"
                  onClick={() =>
                    changeUserStatus(
                      selectedUser,
                      'disabled'
                    )
                  }
                >
                  Disable
                </Button>

                <Button
                  variant="outlined"
                  color="success"
                  onClick={() =>
                    openMoneyDialog(
                      selectedUser,
                      'fund'
                    )
                  }
                >
                  Credit Account
                </Button>

                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() =>
                    openMoneyDialog(
                      selectedUser,
                      'debit'
                    )
                  }
                >
                  Debit Account
                </Button>

                <Button
                  variant="outlined"
                  onClick={() =>
                    openUserSignal(
                      selectedUser
                    )
                  }
                >
                  Manage Signal
                </Button>
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setUserDialogOpen(
                false
              )
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          CREDIT / DEBIT
      ====================================================== */}

      <Dialog
        open={moneyDialog.open}
        onClose={() =>
          setMoneyDialog({
            open: false,
            type: 'fund',
            user: null,
          })
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {moneyDialog.type ===
          'fund'
            ? 'Credit User Account'
            : 'Debit User Account'}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert
              severity={
                moneyDialog.type ===
                'fund'
                  ? 'info'
                  : 'warning'
              }
            >
              {moneyDialog.user
                ? `User: ${moneyDialog.user.email}`
                : ''}
            </Alert>

            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={moneyAmount}
              onChange={(event) =>
                setMoneyAmount(
                  event.target.value
                )
              }
              inputProps={{
                min: 0,
                step: '0.01',
              }}
            />

            <TextField
              fullWidth
              label="Currency"
              value={moneyCurrency}
              onChange={(event) =>
                setMoneyCurrency(
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description / Admin Note"
              value={
                moneyDescription
              }
              onChange={(event) =>
                setMoneyDescription(
                  event.target.value
                )
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setMoneyDialog({
                open: false,
                type: 'fund',
                user: null,
              })
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color={
              moneyDialog.type ===
              'fund'
                ? 'success'
                : 'warning'
            }
            onClick={
              submitMoneyOperation
            }
            disabled={
              moneyLoading
            }
          >
            {moneyLoading ? (
              <CircularProgress
                size={22}
              />
            ) : moneyDialog.type ===
              'fund' ? (
              'Credit Account'
            ) : (
              'Debit Account'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          TRANSACTION STATUS
      ====================================================== */}

      <Dialog
        open={
          transactionDialogOpen
        }
        onClose={() =>
          setTransactionDialogOpen(
            false
          )
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Update Transaction
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            {selectedTransaction && (
              <Alert severity="info">
                Transaction #
                {
                  selectedTransaction.id
                }
                {' — '}
                {formatMoney(
                  selectedTransaction.amount,
                  selectedTransaction.currency ||
                    'USD'
                )}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>
                Status
              </InputLabel>

              <Select
                label="Status"
                value={
                  transactionStatus
                }
                onChange={(event) =>
                  setTransactionStatus(
                    event.target
                      .value as TransactionStatus
                  )
                }
              >
                <MenuItem value="PENDING">
                  PENDING
                </MenuItem>

                <MenuItem value="PROCESSING">
                  PROCESSING
                </MenuItem>

                <MenuItem value="COMPLETED">
                  COMPLETED
                </MenuItem>

                <MenuItem value="FAILED">
                  FAILED
                </MenuItem>

                <MenuItem value="CANCELLED">
                  CANCELLED
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Admin Note"
              value={
                transactionNote
              }
              onChange={(event) =>
                setTransactionNote(
                  event.target.value
                )
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setTransactionDialogOpen(
                false
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              updateTransaction
            }
            disabled={
              transactionLoading
            }
          >
            {transactionLoading ? (
              <CircularProgress
                size={22}
              />
            ) : (
              'Save Status'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          WITHDRAWAL DETAILS
      ====================================================== */}

      <Dialog
        open={
          withdrawalDetailsOpen
        }
        onClose={() =>
          setWithdrawalDetailsOpen(
            false
          )
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Withdrawal Details
        </DialogTitle>

        <DialogContent dividers>
          {withdrawalDetailsLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent:
                  'center',
                py: 5,
              }}
            >
              <CircularProgress />
            </Box>
          ) : selectedWithdrawal ? (
            <Stack spacing={2}>
              <Alert severity="info">
                Withdrawal #
                {
                  selectedWithdrawal.id
                }
                {' — '}
                {formatMoney(
                  selectedWithdrawal.amount,
                  selectedWithdrawal.currency ||
                    'USD'
                )}
              </Alert>

              <Grid
                container
                spacing={2}
              >
                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Status
                  </Typography>

                  <Chip
                    label={
                      selectedWithdrawal.status ||
                      'UNKNOWN'
                    }
                    color={statusColor(
                      selectedWithdrawal.status
                    )}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Reference
                  </Typography>

                  <Typography
                    fontWeight={600}
                  >
                    {
                      selectedWithdrawal.transactionReference ||
                      '—'
                    }
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Payment Method
                  </Typography>

                  <Typography
                    fontWeight={600}
                  >
                    {
                      selectedWithdrawal.paymentMethod ||
                      '—'
                    }
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Created
                  </Typography>

                  <Typography>
                    {formatDate(
                      selectedWithdrawal.createdAt
                    )}
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Description
                  </Typography>

                  <Typography>
                    {
                      selectedWithdrawal.description ||
                      '—'
                    }
                  </Typography>
                </Grid>
              </Grid>

              {withdrawalDetails && (
                <>
                  <Divider />

                  <Typography
                    variant="h6"
                    fontWeight={800}
                  >
                    Server Details
                  </Typography>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      overflow: 'auto',
                    }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace:
                          'pre-wrap',
                        wordBreak:
                          'break-word',
                        fontFamily:
                          'monospace',
                      }}
                    >
                      {JSON.stringify(
                        withdrawalDetails,
                        null,
                        2
                      )}
                    </pre>
                  </Paper>
                </>
              )}
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setWithdrawalDetailsOpen(
                false
              )
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          WITHDRAWAL CODE
      ====================================================== */}

      <Dialog
        open={
          withdrawalCodeOpen
        }
        onClose={() =>
          !withdrawalCodeLoading &&
          setWithdrawalCodeOpen(
            false
          )
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Withdrawal Generating Code
        </DialogTitle>

        <DialogContent dividers>
          {withdrawalCodeLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent:
                  'center',
                py: 5,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Alert severity="success">
                Withdrawal code generated.
              </Alert>

              {generatedWithdrawalCode ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    textAlign:
                      'center',
                  }}
                >
                  <Typography
                    color="text.secondary"
                    gutterBottom
                  >
                    Withdrawal Code
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={900}
                    sx={{
                      letterSpacing: 3,
                      wordBreak:
                        'break-word',
                    }}
                  >
                    {
                      generatedWithdrawalCode
                    }
                  </Typography>
                </Paper>
              ) : (
                <Typography
                  color="text.secondary"
                >
                  The server did not return the
                  withdrawal code in the expected
                  response field.
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setWithdrawalCodeOpen(
                false
              )
            }
            disabled={
              withdrawalCodeLoading
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          INVESTMENT PLAN
      ====================================================== */}

      <Dialog
        open={
          investmentDialogOpen
        }
        onClose={() =>
          setInvestmentDialogOpen(
            false
          )
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingInvestmentPlan
            ? 'Edit Investment Plan'
            : 'Create Investment Plan'}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Plan Name"
              value={
                investmentForm.name
              }
              onChange={(event) =>
                setInvestmentForm({
                  ...investmentForm,
                  name:
                    event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              value={
                investmentForm.description
              }
              onChange={(event) =>
                setInvestmentForm({
                  ...investmentForm,
                  description:
                    event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              type="number"
              label="Minimum Amount"
              value={
                investmentForm.minimumAmount
              }
              onChange={(event) =>
                setInvestmentForm({
                  ...investmentForm,
                  minimumAmount:
                    event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              type="number"
              label="Maximum Amount"
              value={
                investmentForm.maximumAmount
              }
              onChange={(event) =>
                setInvestmentForm({
                  ...investmentForm,
                  maximumAmount:
                    event.target.value,
                })
              }
              helperText="Leave blank for no maximum."
            />

            <TextField
              fullWidth
              type="number"
              label="ROI %"
              value={
                investmentForm.roiPercent
              }
              onChange={(event) =>
                setInvestmentForm({
                  ...investmentForm,
                  roiPercent:
                    event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              type="number"
              label="Duration in Days"
              value={
                investmentForm.durationDays
              }
              onChange={(event) =>
                setInvestmentForm({
                  ...investmentForm,
                  durationDays:
                    event.target.value,
                })
              }
            />

            <FormControl fullWidth>
              <InputLabel>
                Status
              </InputLabel>

              <Select
                label="Status"
                value={
                  investmentForm.status
                }
                onChange={(event) =>
                  setInvestmentForm({
                    ...investmentForm,
                    status:
                      event.target.value,
                  })
                }
              >
                <MenuItem value="ACTIVE">
                  ACTIVE
                </MenuItem>

                <MenuItem value="INACTIVE">
                  INACTIVE
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setInvestmentDialogOpen(
                false
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              saveInvestmentPlan
            }
            disabled={
              investmentLoading
            }
          >
            {investmentLoading ? (
              <CircularProgress
                size={22}
              />
            ) : (
              'Save Plan'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          SIGNAL PLAN
      ====================================================== */}

      <Dialog
        open={signalDialogOpen}
        onClose={() =>
          setSignalDialogOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingSignalPlan
            ? 'Edit Signal Plan'
            : 'Create Signal Plan'}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Signal Plan Name"
              value={
                signalForm.name
              }
              onChange={(event) =>
                setSignalForm({
                  ...signalForm,
                  name:
                    event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              value={
                signalForm.description
              }
              onChange={(event) =>
                setSignalForm({
                  ...signalForm,
                  description:
                    event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              type="number"
              label="Signal Strength %"
              value={
                signalForm.strength
              }
              onChange={(event) =>
                setSignalForm({
                  ...signalForm,
                  strength:
                    event.target.value,
                })
              }
              inputProps={{
                min: 0,
                max: 100,
              }}
            />

            <TextField
              fullWidth
              type="number"
              label="Accuracy %"
              value={
                signalForm.accuracyPercent
              }
              onChange={(event) =>
                setSignalForm({
                  ...signalForm,
                  accuracyPercent:
                    event.target.value,
                })
              }
              inputProps={{
                min: 0,
                max: 100,
              }}
            />

            <TextField
              fullWidth
              type="number"
              label="Duration Days"
              value={
                signalForm.durationDays
              }
              onChange={(event) =>
                setSignalForm({
                  ...signalForm,
                  durationDays:
                    event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              type="number"
              label="Price"
              value={
                signalForm.price
              }
              onChange={(event) =>
                setSignalForm({
                  ...signalForm,
                  price:
                    event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              label="Currency"
              value={
                signalForm.currency
              }
              onChange={(event) =>
                setSignalForm({
                  ...signalForm,
                  currency:
                    event.target.value,
                })
              }
            />

            <FormControl fullWidth>
              <InputLabel>
                Status
              </InputLabel>

              <Select
                label="Status"
                value={
                  signalForm.status
                }
                onChange={(event) =>
                  setSignalForm({
                    ...signalForm,
                    status:
                      event.target.value,
                  })
                }
              >
                <MenuItem value="ACTIVE">
                  ACTIVE
                </MenuItem>

                <MenuItem value="INACTIVE">
                  INACTIVE
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setSignalDialogOpen(
                false
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              saveSignalPlan
            }
            disabled={
              signalLoading
            }
          >
            {signalLoading ? (
              <CircularProgress
                size={22}
              />
            ) : (
              'Save Signal Plan'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          USER SIGNAL
      ====================================================== */}

      <Dialog
        open={
          userSignalDialogOpen
        }
        onClose={() =>
          setUserSignalDialogOpen(
            false
          )
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Manage User Signal
        </DialogTitle>

        <DialogContent dividers>
          {userSignalLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent:
                  'center',
                py: 5,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Alert severity="info">
                User:{' '}
                {
                  userSignalUser?.email ||
                  ''
                }
              </Alert>

              <FormControl fullWidth>
                <InputLabel>
                  Signal Plan
                </InputLabel>

                <Select
                  label="Signal Plan"
                  value={
                    userSignalPlanId
                  }
                  onChange={(event) =>
                    setUserSignalPlanId(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="">
                    No Signal Plan
                  </MenuItem>

                  {signalPlans
                    .filter(
                      (plan) =>
                        String(
                          plan.status
                        ).toUpperCase() ===
                        'ACTIVE'
                    )
                    .map(
                      (plan) => (
                        <MenuItem
                          key={
                            plan.id
                          }
                          value={String(
                            plan.id
                          )}
                        >
                          {plan.name}
                          {' — '}
                          {
                            plan.strength
                          }%
                        </MenuItem>
                      )
                    )}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Signal Strength"
                value={
                  userSignalStrength
                }
                onChange={(event) =>
                  setUserSignalStrength(
                    event.target.value
                  )
                }
                inputProps={{
                  min: 0,
                  max: 100,
                }}
              />

              <FormControl fullWidth>
                <InputLabel>
                  Signal Status
                </InputLabel>

                <Select
                  label="Signal Status"
                  value={
                    userSignalEnabled
                      ? 'ACTIVE'
                      : 'INACTIVE'
                  }
                  onChange={(event) =>
                    setUserSignalEnabled(
                      event.target.value ===
                        'ACTIVE'
                    )
                  }
                >
                  <MenuItem value="ACTIVE">
                    ACTIVE
                  </MenuItem>

                  <MenuItem value="INACTIVE">
                    INACTIVE
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Signal Note"
                value={
                  userSignalNote
                }
                onChange={(event) =>
                  setUserSignalNote(
                    event.target.value
                  )
                }
              />

              {userSignal && (
                <Alert severity="success">
                  Current signal:{' '}
                  {
                    userSignal.strength
                  }%
                  {' — '}
                  {
                    userSignal.status
                  }
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setUserSignalDialogOpen(
                false
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              saveUserSignal
            }
            disabled={
              userSignalLoading
            }
          >
            {userSignalLoading ? (
              <CircularProgress
                size={22}
              />
            ) : (
              'Save Signal'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          PAYMENT METHOD
      ====================================================== */}

      <Dialog
        open={
          paymentDialogOpen
        }
        onClose={() =>
          setPaymentDialogOpen(
            false
          )
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingPaymentMethod
            ? 'Edit Payment Method'
            : 'Create Payment Method'}
        </DialogTitle>

        <DialogContent dividers>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              sm={6}
            >
              <TextField
                fullWidth
                label="Name"
                value={
                  paymentForm.name
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    name:
                      event.target.value,
                  })
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={3}
            >
              <TextField
                fullWidth
                label="Type"
                value={
                  paymentForm.type
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    type:
                      event.target.value,
                  })
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={3}
            >
              <TextField
                fullWidth
                label="Currency"
                value={
                  paymentForm.currency
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    currency:
                      event.target.value,
                  })
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >
              <TextField
                fullWidth
                label="Bank Name"
                value={
                  paymentForm.bankName
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    bankName:
                      event.target.value,
                  })
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >
              <TextField
                fullWidth
                label="Account Name"
                value={
                  paymentForm.accountName
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    accountName:
                      event.target.value,
                  })
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
            >
              <TextField
                fullWidth
                label="Account Number"
                value={
                  paymentForm.accountNumber
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    accountNumber:
                      event.target.value,
                  })
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
            >
              <TextField
                fullWidth
                label="Wallet Address"
                value={
                  paymentForm.walletAddress
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    walletAddress:
                      event.target.value,
                  })
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
            >
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Details"
                value={
                  paymentForm.details
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    details:
                      event.target.value,
                  })
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
            >
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Instructions"
                value={
                  paymentForm.instructions
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    instructions:
                      event.target.value,
                  })
                }
              />
            </Grid>

            <Grid
              item
              xs={12}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Status
                </InputLabel>

                <Select
                  label="Status"
                  value={
                    paymentForm.status
                  }
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      status:
                        event.target.value,
                    })
                  }
                >
                  <MenuItem value="ACTIVE">
                    ACTIVE
                  </MenuItem>

                  <MenuItem value="INACTIVE">
                    INACTIVE
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setPaymentDialogOpen(
                false
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              savePaymentMethod
            }
            disabled={
              paymentLoading
            }
          >
            {paymentLoading ? (
              <CircularProgress
                size={22}
              />
            ) : (
              'Save Payment Method'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={5000}
        onClose={() =>
          setSuccess('')
        }
      >
        <Alert
          severity="success"
          onClose={() =>
            setSuccess('')
          }
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
