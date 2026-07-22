$lines = Get-Content 'src/components/DashboardSummaryView.tsx'

function Find-Index($lines, $pattern) {
    for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($lines[$i] -match $pattern) {
            return $i
        }
    }
    return -1
}

$card0 = Find-Index $lines 'Card 0: Hero Overall Progress'
$card2 = Find-Index $lines 'Card 2: Status Breakdown'
$card1 = Find-Index $lines 'Card 1: Total Indicators'
$card3 = Find-Index $lines 'Card 3: Category Status'
$card4 = Find-Index $lines 'Card 4: Reporting Offices'
$card5 = Find-Index $lines 'Card 5: Budget'
$card6 = Find-Index $lines 'Card 6: Employment'
$card7 = Find-Index $lines 'Card 7: Visual Insights'
$card8 = Find-Index $lines 'Card 8: All Indicators'

Write-Output ("card0=$card0 card1=$card1 card2=$card2 card3=$card3 card4=$card4 card5=$card5 card6=$card6 card7=$card7 card8=$card8")

# slices: from comment line to line before next comment
$s0 = $lines[$card0..($card2 - 1)]
$s1 = $lines[$card1..($card3 - 1)]
$s2 = $lines[$card2..($card1 - 1)]
$s3 = $lines[$card3..($card4 - 1)]
$s4 = $lines[$card4..($card5 - 1)]
$s5 = $lines[$card5..($card6 - 1)]
$s6 = $lines[$card6..($card7 - 1)]
$s7 = $lines[$card7..($card8 - 1)]
$s8 = $lines[$card8..($lines.Length - 1)]

# desired order: 0,1,2,3,5,6,4,7,8
$newLines = @()
$newLines += $s0
$newLines += $s1
$newLines += $s2
$newLines += $s3
$newLines += $s5
$newLines += $s6
$newLines += $s4
$newLines += $s7
$newLines += $s8

$newLines | Set-Content 'src/components/DashboardSummaryView.tsx'
Write-Output ("Reordered to " + $newLines.Length + " lines")
