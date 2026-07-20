import i18n from '../i18n/config';

/**
 * 根据当前语言返回货币符号
 * 中文 → ¥，英文 → $
 */
export function getCurrencySymbol(): string {
  const lang = i18n.language;
  return lang?.startsWith('zh') ? '¥' : '$';
}

/**
 * 格式化金额：货币符号 + 金额（保留两位小数）
 */
export function formatCurrency(amount: number | undefined | null): string {
  const symbol = getCurrencySymbol();
  return `${symbol}${(amount ?? 0).toFixed(2)}`;
}
