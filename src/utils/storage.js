const KEYS = {
  BILLS: 'bt_bills',
  INCOME: 'bt_income',
  BUDGET: 'bt_budget',
  SETTINGS: 'bt_settings',
  NOTES: 'bt_notes',
};

function get(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getBills: () => get(KEYS.BILLS) || [],
  setBills: (bills) => set(KEYS.BILLS, bills),

  getIncome: () => get(KEYS.INCOME) || [],
  setIncome: (income) => set(KEYS.INCOME, income),

  getBudget: () => get(KEYS.BUDGET) || {},
  setBudget: (budget) => set(KEYS.BUDGET, budget),

  getSettings: () => get(KEYS.SETTINGS) || { spouseEnabled: false, spouseName: '', myName: 'Me' },
  setSettings: (settings) => set(KEYS.SETTINGS, settings),

  getNotes: () => get(KEYS.NOTES) || [],
  setNotes: (notes) => set(KEYS.NOTES, notes),
};
