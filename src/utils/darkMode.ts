export const dark = {
  // Pages / fonds principaux
  page: 'bg-gray-50 dark:bg-gray-900',
  card: 'bg-white dark:bg-gray-800',
  cardBorder: 'border-gray-200 dark:border-gray-700',

  // Texte
  text: 'text-gray-900 dark:text-gray-100',
  textSecondary: 'text-gray-500 dark:text-gray-400',
  textMuted: 'text-gray-400 dark:text-gray-500',

  // Inputs
  input: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600',
  inputFocus: 'focus:ring-green-500 focus:border-green-500',

  // Tableaux
  tableHead: 'bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600',
  tableHeadText: 'text-gray-600 dark:text-gray-300',
  tableRow: 'border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50',
  tableCell: 'text-gray-900 dark:text-gray-200',

  // Badges / statuts
  badgeGreen: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  badgeYellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  badgeRed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  badgeBlue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  badgePurple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  badgeGray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',

  // Modales
  modalOverlay: 'bg-black/50',
  modalContent: 'bg-white dark:bg-gray-800',

  // Sidebar
  sidebar: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',

  // Hover
  hover: 'hover:bg-gray-100 dark:hover:bg-gray-700',

  // Separator
  separator: 'border-gray-200 dark:border-gray-700',

  // KPI cards
  kpiIcon: 'bg-green-50 dark:bg-green-900/30',
} as const;
