// src/services/fintrackClient.ts
import axios from "axios";

const FINTRACK_API = process.env.FINTRACK_API_URL;

export const getTotalExpense = async (token: string | undefined, start: string, end: string) => {
  type Item = {
    category: string;
    total: number;
  };
  const res = await axios.get(`${FINTRACK_API}/stats/category-stats?type=expense&startDate=${start}&endDate=${end}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const total = res.data.reduce((acc: number, curr: Item ) => acc + curr.total, 0);
  return {
    totalExpense: total,
    categoryExpense: res.data
  };
};

export const getTotalIncome = async (token: string | undefined, start: string, end: string) => {
  type Item = {
    category: string;
    total: number;
  };
  const res = await axios.get(`${FINTRACK_API}/stats/category-stats?type=income&startDate=${start}&endDate=${end}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const total = res.data.reduce((acc: number, curr: Item ) => acc + curr.total, 0);
  return {
    totalIncome: total,
    categoryExpense: res.data
  };
};

export const listTransactions = async (
  token: string | undefined,
  start: string,
  end: string,
  type: string,
  category: string,
  limit = 50
) => {
  const res = await axios.get(`${FINTRACK_API}/transaction`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { startDate: start, endDate: end, type, category, limit},
  });
  return res.data;
};

export const getTopSpendingIncomeCategory = async (token: string | undefined, start: string, end: string, type: string) => {
  const res = await axios.get(`${FINTRACK_API}/stats/category-stats`, {
    headers: { Authorization: `Bearer ${token}` },
    params:{
      type,
      startDate: start,
      endDate: end
    }
  });

  const result = [...res.data].sort((a,b) => b.total - a.total)[0];
  return {
    top: result,
    data: res.data,
  }
}

export const compareIncomeExpense = async (token: string | undefined, start: string, end: string) => {
  const res = await axios.get(`${FINTRACK_API}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    params:{
      startDate: start,
      endDate: end
    }
  });
  const data = res.data;

  return {
    income: data.totalIncome,
    expense: data.totalExpense,
    balance: data.balance
  }
}

export const listRecurring = async (token: string | undefined, start: string, end: string) => {
    const res = await axios.get(`${FINTRACK_API}/transaction/recurring`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data.data;
}

export const getTopTransactions = async (token: string | undefined, start: string, end: string, type: string, order: string) => {
    const res = await axios.get(`${FINTRACK_API}/transaction/top-transactions`, {
    headers: { Authorization: `Bearer ${token}` },
    params:{
      startDate: start,
      endDate: end,
      type,
      order
    }
  });

  return res.data;
}

export const getSpendingByCategory = async (token: string | undefined, start: string, end: string, type: string) => {
  const res = await axios.get(`${FINTRACK_API}/stats/category-stats`, {
    headers: { Authorization: `Bearer ${token}` },
    params:{
      type,
      startDate: start,
      endDate: end
    }
  });

  return {
    data: res.data,
  }
} 