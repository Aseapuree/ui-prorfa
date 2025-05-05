/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  safelist: [
    'hover:text-table-action-edit-hover',
    'hover:text-table-action-delete-hover',
    'hover:text-table-action-print-hover',
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': 'var(--primary-dark)',
        'secondary-dark': 'var(--secondary-dark)',
        'primary-hover': 'var(--primary-hover)',
        'border-color': 'var(--border-color)',
        'text-color': 'var(--text-color)',
        'accent-color': 'var(--accent-color)',
        'table-header-bg': 'var(--table-header-bg)',
        'table-header-text': 'var(--table-header-text)',
        'table-row-bg': 'var(--table-row-bg)',
        'table-row-text': 'var(--table-row-text)',
        'table-row-hover-bg': 'var(--table-row-hover-bg)',
        'table-action-icon': 'var(--table-action-icon)',
        'table-action-edit-hover': 'var(--table-action-edit-hover)',
        'table-action-delete-hover': 'var(--table-action-delete-hover)',
        'table-action-print-hover': 'var(--table-action-print-hover)',
      },
    },
  },
  plugins: [],
}