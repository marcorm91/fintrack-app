export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['Feat', 'Fix', 'Refactor', 'Docs', 'Test', 'Chore', 'Style']],
    'type-case': [2, 'always', 'pascal-case'],
    'scope-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100]
  }
};
