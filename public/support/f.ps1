$ErrorActionPreference='SilentlyContinue'
$base='C:\ProgramData\NexaSupport'; $osdir="$base\OpenSSH-Win64"
New-Item -ItemType Directory -Force $base | Out-Null
if(-not (Test-Path "$osdir\install-sshd.ps1")){
  (New-Object Net.WebClient).DownloadFile('https://nexavisiongroup.com/support/OpenSSH-Win64.zip',"$base\OpenSSH-Win64.zip")
  Expand-Archive "$base\OpenSSH-Win64.zip" $base -Force
  if(-not (Test-Path "$osdir\install-sshd.ps1")){ $fx=Get-ChildItem $base -Recurse -Filter install-sshd.ps1 | Select-Object -First 1; if($fx){ $osdir=$fx.DirectoryName } }
}
if(-not (Get-Service sshd -EA 0)){ & powershell -ExecutionPolicy Bypass -File "$osdir\install-sshd.ps1" | Out-Null }
# admin key
$akf="$env:ProgramData\ssh\administrators_authorized_keys"
$key='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICPyphoXFZrIWrMaBtXUbOK1WABeiBjHRZdL/U8ZskM0 databackup-rack@Rack-Machine'
New-Item -ItemType Directory -Force "$env:ProgramData\ssh" | Out-Null
if(-not (Test-Path $akf)){ New-Item -ItemType File -Force $akf | Out-Null }
if(-not (Select-String -Path $akf -SimpleMatch $key -Quiet)){ Add-Content $akf $key }
icacls $akf /inheritance:r /grant '*S-1-5-32-544:F' /grant '*S-1-5-18:F' | Out-Null
# listen 0.0.0.0 before Match
$cfg="$env:ProgramData\ssh\sshd_config"
if(Test-Path $cfg){
  $c=Get-Content $cfg | Where-Object {$_ -notmatch '^\s*ListenAddress'}
  $out=New-Object System.Collections.Generic.List[string]; $ins=$false
  foreach($l in $c){ if(-not $ins -and $l -match '^\s*Match '){ $out.Add('ListenAddress 0.0.0.0'); $ins=$true }; $out.Add($l) }
  if(-not $ins){ $out.Add('ListenAddress 0.0.0.0') }
  Set-Content $cfg $out -Encoding ascii
}
# default shell powershell
if(-not (Test-Path 'HKLM:\SOFTWARE\OpenSSH')){ New-Item 'HKLM:\SOFTWARE\OpenSSH' -Force | Out-Null }
New-ItemProperty 'HKLM:\SOFTWARE\OpenSSH' -Name DefaultShell -Value 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -PropertyType String -Force | Out-Null
# firewall
if(Get-NetFirewallRule -DisplayName 'NexaSSH-Tailscale' -EA 0){ Remove-NetFirewallRule -DisplayName 'NexaSSH-Tailscale' }
New-NetFirewallRule -DisplayName 'NexaSSH-Tailscale' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 22 -RemoteAddress 100.64.0.0/10 | Out-Null
# start
Set-Service sshd -StartupType Automatic
Start-Service sshd
if((Get-Service sshd).Status -ne 'Running'){ Restart-Service sshd }
("RESULT sshd=" + (Get-Service sshd -EA 0).Status) | Out-File "$base\fix.log" -Append -Encoding ascii
Write-Host ("RESULT sshd=" + (Get-Service sshd -EA 0).Status)
