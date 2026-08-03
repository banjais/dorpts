import React from 'react';

export const highlightText = (text: string, highlight: string) => {
  if (!highlight || !highlight.trim()) {
    return React.createElement('span', null, text);
  }
  try {
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp("(" + escapedHighlight + ")", "gi");
    const parts = text.split(regex);
    return React.createElement('span', null, 
      parts.map((part, i) => 
        regex.test(part) ? (
          React.createElement('mark', { 
            key: i, 
            className: "bg-yellow-200 dark:bg-yellow-600/50 text-yellow-900 dark:text-yellow-100 px-0.5 rounded font-bold" 
          }, part)
        ) : (
          part
        )
      )
    );
  } catch {
    return React.createElement('span', null, text);
  }
};
