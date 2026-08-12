export const monthlyRecapTranslations = {
  es: {
    title: '{{month}}, en resumen',
    noData: 'Todavía no hay datos guardados para {{month}}.',
    noComparison: 'Cuando guardes el mes anterior, podremos contarte cómo ha cambiado.',
    expenseMore: 'Has gastado {{amount}} más que en {{month}}.',
    expenseLess: 'Has gastado {{amount}} menos que en {{month}}.',
    expenseSame: 'Has mantenido el mismo gasto que en {{month}}.',
    statusBetter: 'Buen mes: has contenido el gasto y tu ahorro ha mejorado.',
    statusWorse: 'Este mes se ha desviado un poco. El detalle te ayuda a ver qué ha cambiado.',
    statusSimilar: 'Has mantenido un ritmo parecido al mes pasado.',
    expenses: 'Gastos',
    savings: 'Ahorro',
    wealth: 'Patrimonio'
  },
  en: {
    title: '{{month}} at a glance',
    noData: 'There is no data saved for {{month}} yet.',
    noComparison: 'Once you save the previous month, we can show you what changed.',
    expenseMore: 'You spent {{amount}} more than in {{month}}.',
    expenseLess: 'You spent {{amount}} less than in {{month}}.',
    expenseSame: 'Your spending is the same as in {{month}}.',
    statusBetter: 'A good month: spending stayed under control and your savings improved.',
    statusWorse: 'This month drifted a little. The detail helps you see what changed.',
    statusSimilar: 'You kept a similar pace to last month.',
    expenses: 'Expenses',
    savings: 'Savings',
    wealth: 'Wealth'
  }
} as const;
