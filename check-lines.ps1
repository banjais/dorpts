$lines = Get-Content 'src/components/DashboardSummaryView.tsx'
Write-Output ('Total lines: ' + $lines.Length)
