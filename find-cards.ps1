$lines = Get-Content 'src/components/DashboardSummaryView.tsx'
Write-Output ('Total lines: ' + $lines.Length)

$patterns = @(
    'Card 0: Hero Overall Progress',
    'Card 2: Status Breakdown',
    'Card 1: Total Indicators',
    'Card 3: Category Status',
    'Card 4: Reporting Offices',
    'Card 5: Budget',
    'Card 6: Employment',
    'Card 7: Visual Insights',
    'Card 8: All Indicators'
)

foreach ($p in $patterns) {
    for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($lines[$i] -match $p) {
            Write-Output ($p + ' at line ' + ($i + 1))
            break
        }
    }
}
