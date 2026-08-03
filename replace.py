import re
with open("src/components/DashboardStats.tsx", "r") as f:
    content = f.read()

old_str = """        isSummary 
          ? 'bg-gradient-to-br from-indigo-900 to-slate-950 p-4 sm:p-6 text-white border-white/10 shadow-2xl shadow-indigo-500/10' 
          : isSector
            ? 'bg-white dark:bg-slate-900 p-4 sm:p-6 border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-black/40'
            : 'bg-white dark:bg-slate-800/40 p-4 sm:p-5 border-slate-100 dark:border-white/5 shadow-md shadow-slate-200/20'"""

new_str = """        isSummary 
          ? 'bg-gradient-to-br from-indigo-500/10 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-6 border border-indigo-150 dark:border-indigo-950/60 shadow-sm relative overflow-hidden transition-all hover:border-indigo-200 dark:hover:border-indigo-800' 
          : isSector
            ? 'bg-white dark:bg-slate-900 p-4 sm:p-6 border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700'
            : 'bg-white dark:bg-slate-900 p-4 sm:p-5 border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700'"""

content = content.replace(old_str, new_str)

with open("src/components/DashboardStats.tsx", "w") as f:
    f.write(content)
