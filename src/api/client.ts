const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export async function apiCall(
  endpoint: string,
  params: Record<string, string> = {},
  body?: Record<string, unknown>
): Promise<unknown> {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/${endpoint}${query ? '?' + query : ''}`;

  const options: RequestInit = {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    let errorMsg = `Erreur ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {
      // réponse vide ou non-JSON, on garde le message par défaut
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return data;
}

// Membres
export const membresApi = {
  list: (filters?: Record<string, string>) => apiCall('membres.php', { action: 'list', ...(filters || {}) }),
  get: (id: string) => apiCall('membres.php', { action: 'get', id }),
  search: (q: string) => apiCall('membres.php', { action: 'search', q }),
  create: (data: Record<string, unknown>) => apiCall('membres.php', { action: 'create' }, data),
  update: (data: Record<string, unknown>) => apiCall('membres.php', { action: 'update' }, data),
  delete: (id: string) => apiCall('membres.php', { action: 'delete' }, { id })
};

// Projets
export const projetsApi = {
  list: (filters?: { statut?: string; categorie?: string }) =>
    apiCall('projets.php', { action: 'list', ...(filters || {}) }),
  get: (id: string) => apiCall('projets.php', { action: 'get', id }),
  create: (data: Record<string, unknown>) => apiCall('projets.php', { action: 'create' }, data),
  update: (data: Record<string, unknown>) => apiCall('projets.php', { action: 'update' }, data),
  delete: (id: string) => apiCall('projets.php', { action: 'delete' }, { id })
};

// Dons
export const donsApi = {
  list: (filters?: { projet_id?: string; statut?: string }) =>
    apiCall('dons.php', { action: 'list', ...(filters || {}) }),
  get: (id: string) => apiCall('dons.php', { action: 'get', id }),
  create: (data: Record<string, unknown>) => apiCall('dons.php', { action: 'create' }, data),
  update: (data: Record<string, unknown>) => apiCall('dons.php', { action: 'update' }, data),
  delete: (id: string) => apiCall('dons.php', { action: 'delete' }, { id })
};

// Transactions
export const transactionsApi = {
  list: (filters?: { type?: string; projet_id?: string; date_debut?: string; date_fin?: string }) =>
    apiCall('transactions.php', { action: 'list', ...(filters || {}) }),
  get: (id: string) => apiCall('transactions.php', { action: 'get', id }),
  create: (data: Record<string, unknown>) => apiCall('transactions.php', { action: 'create' }, data),
  update: (data: Record<string, unknown>) => apiCall('transactions.php', { action: 'update' }, data),
  delete: (id: string) => apiCall('transactions.php', { action: 'delete' }, { id }),
  stats: () => apiCall('transactions.php', { action: 'stats' })
};

// Événements
export const evenementsApi = {
  list: (filters?: { statut?: string; type?: string }) =>
    apiCall('evenements.php', { action: 'list', ...(filters || {}) }),
  get: (id: string) => apiCall('evenements.php', { action: 'get', id }),
  create: (data: Record<string, unknown>) => apiCall('evenements.php', { action: 'create' }, data),
  update: (data: Record<string, unknown>) => apiCall('evenements.php', { action: 'update' }, data),
  delete: (id: string) => apiCall('evenements.php', { action: 'delete' }, { id })
};

// Paramètres
export const settingsApi = {
  get: () => apiCall('settings.php', { action: 'get' }),
  update: (data: Record<string, unknown>) => apiCall('settings.php', { action: 'update' }, data)
};

// Stocks
export const stocksApi = {
  articles: {
    list: (filters?: { categorie_id?: string; projet_id?: string; low_stock?: string }) =>
      apiCall('stocks.php', { action: 'list', entity: 'articles', ...(filters || {}) }),
    get: (id: string) => apiCall('stocks.php', { action: 'get', entity: 'articles', id }),
    search: (q: string) => apiCall('stocks.php', { action: 'search', entity: 'articles', q }),
    create: (data: Record<string, unknown>) => apiCall('stocks.php', { action: 'create', entity: 'articles' }, data),
    update: (data: Record<string, unknown>) => apiCall('stocks.php', { action: 'update', entity: 'articles' }, data),
    delete: (id: string) => apiCall('stocks.php', { action: 'delete', entity: 'articles' }, { id }),
    stats: () => apiCall('stocks.php', { action: 'stats', entity: 'articles' })
  },
  categories: {
    list: () => apiCall('stocks.php', { action: 'list', entity: 'categories' }),
    create: (data: Record<string, unknown>) => apiCall('stocks.php', { action: 'create', entity: 'categories' }, data),
    update: (data: Record<string, unknown>) => apiCall('stocks.php', { action: 'update', entity: 'categories' }, data),
    delete: (id: string) => apiCall('stocks.php', { action: 'delete', entity: 'categories' }, { id })
  },
  mouvements: {
    list: (filters?: { article_id?: string }) =>
      apiCall('stocks.php', { action: 'list', entity: 'mouvements', ...(filters || {}) }),
    create: (data: Record<string, unknown>) => apiCall('stocks.php', { action: 'create', entity: 'mouvements' }, data),
    delete: (id: string) => apiCall('stocks.php', { action: 'delete', entity: 'mouvements' }, { id })
  }
};
