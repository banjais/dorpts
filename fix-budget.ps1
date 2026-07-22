$lines = Get-Content 'src/components/DashboardSummaryView.tsx'
for($i=0; $i -lt $lines.Length; $i++){
  if($lines[$i] -match 'const target = capexInd.annualTarget \|\| 0;' -and $i -gt 1850){
    Write-Output ('Found at line ' + ($i+1) + ': ' + $lines[$i])
    break
  }
}
