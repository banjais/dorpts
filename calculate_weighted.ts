import { DEFAULT_INDICATORS } from './src/data';

const count = DEFAULT_INDICATORS.length;
const sumCapped = DEFAULT_INDICATORS.reduce((acc, curr) => {
  const target = curr.annualTarget || 0;
  const progress = curr.annualProgress || 0;
  const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  return acc + achievement;
}, 0);
console.log('Unweighted average capped:', sumCapped / count);

const activeIndicators = DEFAULT_INDICATORS.filter(curr => curr.annualTarget > 0);
const activeCount = activeIndicators.length;
const sumActiveCapped = activeIndicators.reduce((acc, curr) => {
  const target = curr.annualTarget || 0;
  const progress = curr.annualProgress || 0;
  const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  return acc + achievement;
}, 0);
console.log('Active unweighted average capped:', sumActiveCapped / activeCount);
