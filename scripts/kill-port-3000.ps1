# Free ports 3000/3001 before starting Next.js (avoids stale dev server + broken UI)
Get-NetTCPConnection -LocalPort 3000, 3001 -ErrorAction SilentlyContinue |
  ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
  }
