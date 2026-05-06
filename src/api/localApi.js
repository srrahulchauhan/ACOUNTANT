const TRANSACTIONS_KEY = "account_transactions";
const CUSTOMERS_KEY = "account_customers";

const getLocalData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Transactions
export const fetchTransactions = async (params = {}) => {
  let data = getLocalData(TRANSACTIONS_KEY);
  
  // Sort by date descending
  data.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

  if (params.search) {
    const s = params.search.toLowerCase();
    data = data.filter(t => 
      t.name?.toLowerCase().includes(s) || 
      t.lastName?.toLowerCase().includes(s) || 
      t.description?.toLowerCase().includes(s)
    );
  }
  return { data };
};

export const createTransaction = async (t) => {
  const data = getLocalData(TRANSACTIONS_KEY);
  const newTx = { ...t, _id: Date.now().toString(), createdAt: new Date().toISOString() };
  data.push(newTx);
  setLocalData(TRANSACTIONS_KEY, data);
  return { data: newTx };
};

export const updateTransaction = async (id, t) => {
  let data = getLocalData(TRANSACTIONS_KEY);
  const index = data.findIndex(x => x._id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...t };
    setLocalData(TRANSACTIONS_KEY, data);
    return { data: data[index] };
  }
  return { data: null };
};

export const deleteTransaction = async (id) => {
  let data = getLocalData(TRANSACTIONS_KEY);
  data = data.filter(x => x._id !== id);
  setLocalData(TRANSACTIONS_KEY, data);
  return { data: { message: 'Deleted' } };
};

// Customers
export const fetchCustomers = async () => {
  const data = getLocalData(CUSTOMERS_KEY);
  return { data };
};

export const createCustomer = async (c) => {
  const data = getLocalData(CUSTOMERS_KEY);
  const newC = { 
    ...c, 
    _id: Date.now().toString(),
    balance: 0,
    totalCredit: 0,
    totalDebit: 0,
    transactionsCount: 0,
    createdAt: new Date().toISOString() 
  };
  data.push(newC);
  setLocalData(CUSTOMERS_KEY, data);
  return { data: newC };
};

export const updateCustomer = async (id, c) => {
  let data = getLocalData(CUSTOMERS_KEY);
  const index = data.findIndex(x => x._id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...c };
    setLocalData(CUSTOMERS_KEY, data);
    return { data: data[index] };
  }
  return { data: null };
};

export const deleteCustomer = async (id) => {
  let data = getLocalData(CUSTOMERS_KEY);
  data = data.filter(x => x._id !== id);
  setLocalData(CUSTOMERS_KEY, data);
  return { data: { message: 'Deleted' } };
};
