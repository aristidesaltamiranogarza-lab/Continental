# Corre casona_pb.py (o casona_pa/sm/az/calle.py con "pa"/"sm"/"az"/"calle" primero) en Blender y muestra solo el avance.
# Ej.: .\blender\hornear.ps1 prueba C:\tmp\luz    |    .\blender\hornear.ps1 hornear    |    .\blender\hornear.ps1 pa hornear
$a = @($args)
$py = 'casona_pb.py'
if ($a.Count -and $a[0] -in @("pa","sm","az","calle")) { $py = "casona_$($a[0]).py"; $a = @($a | Select-Object -Skip 1) }
$b = (Get-Command blender -ErrorAction SilentlyContinue).Source
if (-not $b) { $b = Get-ChildItem 'C:\Program Files\Blender Foundation\*\blender.exe' | Sort-Object FullName | Select-Object -Last 1 -ExpandProperty FullName }
$t = Get-Date
& $b -b --factory-startup --python (Join-Path $PSScriptRoot $py) -- @a 2>&1 | ForEach-Object { "$_" } |
    Where-Object { $_ -cmatch 'GPU:|sin GPU|Horneado|dentro de otra|luz: |prueba:|comparar|Error:|Traceback|presupuesto|.glb' }
'Listo en {0:n1} min' -f ((Get-Date) - $t).TotalMinutes
