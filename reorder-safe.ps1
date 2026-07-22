$lines = Get-Content 'src/components/DashboardSummaryView.tsx'

# Extract blocks using 0-based indices
# Card 0: 982..1154 (lines 983-1155)
$b0 = $lines[982..1154]
# Card 1: 1352..1434 (lines 1353-1435)
$b1 = $lines[1352..1434]
# Card 2: 1155..1351 (lines 1156-1352)
$b2 = $lines[1155..1351]
# Card 3: 1435..1622 (lines 1436-1623)
$b3 = $lines[1435..1622]
# Card 4: 1623..1696 (lines 1624-1697)
$b4 = $lines[1623..1696]
# Card 5: 1697..1866 (lines 1698-1867)
$b5 = $lines[1697..1866]
# Card 6: 1867..1976 (lines 1868-1977)
$b6 = $lines[1867..1976]
# Card 7: 1977..2115 (lines 1978-2116)
$b7 = $lines[1977..2115]
# Card 8: 2116..2361 (lines 2117-2362)
$b8 = $lines[2116..($lines.Length - 1)]

Write-Output ("b0=$($b0.Length) b1=$($b1.Length) b2=$($b2.Length) b3=$($b3.Length) b4=$($b4.Length) b5=$($b5.Length) b6=$($b6.Length) b7=$($b7.Length) b8=$($b8.Length)")

$newLines = @()
$newLines += $b0
$newLines += $b1
$newLines += $b2
$newLines += $b3
$newLines += $b5
$newLines += $b6
$newLines += $b4
$newLines += $b7
$newLines += $b8

Write-Output ('New total: ' + $newLines.Length)
$newLines | Set-Content 'src/components/DashboardSummaryView.tsx'
