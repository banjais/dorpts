import fetch from 'node-fetch';

async function main() {
  const url = 'https://docs.google.com/spreadsheets/d/1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM/export?format=csv&gid=40941786';
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n');
    console.log('Total lines in sheet 40941786:', lines.length);
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      console.log(`Row ${i}:`, lines[i]);
    }
  } catch (err) {
    console.error(err);
  }
}

main();
