export const wealthGoalTranslations = {
  "en": {
    "title": "Wealth goal",
    "define": "Set a goal",
    "defineLabel": "Set a goal for your wealth",
    "yourProgress": "Your progress",
    "create": "New wealth goal",
    "edit": "Edit wealth goal",
    "empty": "Set an amount and a date to track your progress.",
    "amount": "Target amount (EUR)",
    "endMonth": "End date",
    "save": "Save",
    "delete": "Delete goal",
    "progress": "Progress towards your wealth goal",
    "remaining": "Remaining",
    "needed": "You need",
    "perMonth": "{{amount}} EUR/month",
    "due": "The target date has arrived",
    "reached": "Goal reached",
    "error": {
      "amount": "Enter an amount greater than zero.",
      "month": "Choose a valid month on or after the current month and the displayed wealth month.",
      "save": "Could not save your goal. Please try again."
    }
  },
  "es": {
    "title": "Objetivo de patrimonio",
    "define": "Definir objetivo",
    "defineLabel": "Definir objetivo de patrimonio",
    "yourProgress": "Tu progreso",
    "create": "Nuevo objetivo de patrimonio",
    "edit": "Editar objetivo de patrimonio",
    "empty": "Define una cantidad y una fecha para seguir tu progreso.",
    "amount": "Cantidad objetivo (EUR)",
    "endMonth": "Fecha fin",
    "save": "Guardar",
    "delete": "Eliminar objetivo",
    "progress": "Progreso hacia el objetivo de patrimonio",
    "remaining": "Faltan",
    "needed": "Necesitas",
    "perMonth": "{{amount}} EUR/mes",
    "due": "La fecha objetivo ha llegado",
    "reached": "Objetivo alcanzado",
    "error": {
      "amount": "Introduce una cantidad mayor que cero.",
      "month": "Elige un mes válido, igual o posterior al mes actual y al del patrimonio mostrado.",
      "save": "No se ha podido guardar el objetivo. Inténtalo de nuevo."
    }
  }
};

export const wealthGoalSyncTranslations = {
  es: {
    syncConflictDescription: 'Fintrack no ha sobrescrito ninguna versión. Elige qué copia quieres conservar para los datos en conflicto.',
    syncConflictKeepLocalConfirm: 'Se conservarán los {{count}} registros locales en conflicto y se subirán como una versión nueva.',
    syncConflictUseCloudConfirm: 'Los {{count}} registros locales en conflicto se reemplazarán por la versión cloud. La copia JSON que guardaste permite recuperarlos.'
  },
  en: {
    syncConflictDescription: 'Fintrack has not overwritten either version. Choose which copy to keep for the conflicting data.',
    syncConflictKeepLocalConfirm: 'The {{count}} conflicting local records will be kept and uploaded as a new version.',
    syncConflictUseCloudConfirm: 'The {{count}} conflicting local records will be replaced by the cloud version. Your saved JSON backup can restore them.'
  }
};
