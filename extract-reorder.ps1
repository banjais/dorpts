$lines = Get-Content 'src/components/DashboardSummaryView.tsx'
$slice = $lines[1153..1434]
$slice | Set-Content 'budget-reorder.txt'
Write-Output ("Extracted " + $slice.Length + " lines")
