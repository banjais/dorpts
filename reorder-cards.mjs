import { readFileSync, writeFileSync } from 'fs';
const path = 'src/components/DashboardSummaryView.tsx';
const lines = readFileSync(path, 'utf8').split(/\r?\n/);

function findIndex(pattern) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) return i;
  }
  return -1;
}

const card0 = findIndex('Card 0: Hero Overall Progress');
const card2 = findIndex('Card 2: Status Breakdown');
const card1 = findIndex('Card 1: Total Indicators');
const card3 = findIndex('Card 3: Category Status');
const card4 = findIndex('Card 4: Reporting Offices');
const card5 = findIndex('Card 5: Budget');
const card6 = findIndex('Card 6: Employment');
const card7 = findIndex('Card 7: Visual Insights');
const card8 = findIndex('Card 8: All Indicators');

console.log(`card0=${card0} card1=${card1} card2=${card2} card3=${card3} card4=${card4} card5=${card5} card6=${card6} card7=${card7} card8=${card8}`);

// Each card block: from comment line to just before next comment
const blocks = {
  0: lines.slice(card0, card2),
  1: lines.slice(card1, card3),
  2: lines.slice(card2, card1),
  3: lines.slice(card3, card4),
  4: lines.slice(card4, card5),
  5: lines.slice(card5, card6),
  6: lines.slice(card6, card7),
  7: lines.slice(card7, card8),
  8: lines.slice(card8),
};

console.log(`Block lengths: ${Object.values(blocks).map(b => b.length).join(', ')}`);

// Desired order: 0,1,2,3,5,6,4,7,8
const ordered = [blocks[0], blocks[1], blocks[2], blocks[3], blocks[5], blocks[6], blocks[4], blocks[7], blocks[8]];

const preCards = lines.slice(0, card0);
const lastBlock8Line = card8 + blocks[8].length;
const postCards = lines.slice(lastBlock8Line);

const newLines = [...preCards, ...ordered.flat(), ...postCards];
console.log(`Pre: ${preCards.length}, Post: ${postCards.length}, New total: ${newLines.length}`);

writeFileSync(path, newLines.join('\n'));
console.log('Done');
