import fetch from 'node-fetch';

async function main() {
  const url = 'https://docs.google.com/spreadsheets/d/1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM/export?format=csv&gid=0';
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n');
    
    // Parse CSV rows
    const rows = lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });

    // Let's find indicators
    let sumWeight = 0;
    let sumWeightedAchievementCapped = 0;
    let sumWeightedAchievementUncapped = 0;

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 11) continue;
      const name = row[1];
      if (!name || name.includes('कुल') || name.includes('Total') || name.includes('Last Update') || name.includes('Next Update')) {
        continue;
      }
      const weight = parseFloat(row[4]) || 0;
      const target = parseFloat(row[9]) || 0;
      const progress = parseFloat(row[10]) || 0;

      if (weight > 0) {
        const achievement = target > 0 ? (progress / target) * 100 : 0;
        const achievementCapped = Math.min(achievement, 100);
        sumWeight += weight;
        sumWeightedAchievementCapped += achievementCapped * (weight / 100);
        sumWeightedAchievementUncapped += achievement * (weight / 100);
        console.log(`Indicator: ${name}, weight: ${weight}, target: ${target}, progress: ${progress}, achCapped: ${achievementCapped}`);
      }
    }

    console.log('--- Total weight:', sumWeight);
    console.log('--- Weighted average capped (scaled by 100/sumWeight):', (sumWeightedAchievementCapped / (sumWeight / 100)));
    console.log('--- Weighted average uncapped (scaled by 100/sumWeight):', (sumWeightedAchievementUncapped / (sumWeight / 100)));
  } catch (err) {
    console.error(err);
  }
}

main();
