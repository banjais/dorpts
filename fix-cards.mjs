import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filePath = join(process.cwd(), 'src/components/Overview.tsx');
let content = readFileSync(filePath, 'utf8');

// Remove mode="popLayout" from AnimatePresence
content = content.replace(/<AnimatePresence mode="popLayout">/g, '<AnimatePresence>');

// Remove layout prop from outer motion.div wrappers of cards
// Pattern: motion.div with key and layout prop
content = content.replace(/(<motion\.div\s+key="[^"]*"\s+)layout\s+/g, '$1');

// Remove animate={{ opacity: 1, scale: 1 }} from inner card motion elements
// These cause re-animation on every re-render
content = content.replace(/\s+animate=\{\{\s*opacity:\s*1,\s*scale:\s*1\s*\}\}/g, '');

writeFileSync(filePath, content);
console.log('Fixed: removed popLayout mode, layout props, and inner animate scale');
