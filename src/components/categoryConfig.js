export const CATEGORY_ORDER = [
  { type: 'budget', route: 'budget', label: 'Budget Stay' },
  { type: 'premium', route: 'comfort', label: 'Comfort Stay' },
  { type: 'bamboo', route: 'bamboo', label: 'Bamboo Stay' },
];

export const getCategoryByType = (type) =>
  CATEGORY_ORDER.find((category) => category.type === type) ?? null;

export const getCategoryByRoute = (route) =>
  CATEGORY_ORDER.find((category) => category.route === route) ?? null;
