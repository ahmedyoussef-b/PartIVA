# F:\PartIVA\build-desktop.ps1

param(
    [switch]$SkipRestore
)

$ErrorActionPreference = "Stop"
$repoRoot = "F:\PartIVA"
$actionsSrc = "$repoRoot\src\lib\actions"
$actionsBackup = "$repoRoot\disabled-pages\lib-actions-backup"

function Backup-Actions {
    if (Test-Path $actionsSrc) {
        if (Test-Path $actionsBackup) {
            Remove-Item -Recurse -Force $actionsBackup
        }
        Copy-Item $actionsSrc $actionsBackup -Recurse -Force
        Write-Host "Actions sauvegardees vers $actionsBackup"
    }
}

function Create-Mock-Actions {
    Write-Host "Creation des mocks Server Actions..."
    
    # requests.ts
    $requestsContent = @"
'use client';

export async function createRequest(input: unknown) {
  return { success: true, data: { id: 'mock' }, error: null };
}

export async function updateRequestStatus(input: { id: string; status: string }) {
  return { success: true, data: null, error: null };
}

export async function updateRequestUrgency(input: { id: string; urgency: string }) {
  return { success: true, data: null, error: null };
}

export async function deleteRequest(input: { id: string }) {
  return { success: true, data: null, error: null };
}
"@
    $requestsContent | Set-Content -Path "$actionsSrc\requests.ts" -Encoding utf8

    # machines.ts
    $machinesContent = @"
'use client';

export async function createMachine(input: unknown) {
  return { success: true, data: { id: 'mock' }, error: null };
}

export async function updateMachine(input: unknown) {
  return { success: true, data: null, error: null };
}

export async function deleteMachine(input: { id: string }) {
  return { success: true, data: null, error: null };
}

export async function updateMachineStatus(input: { id: string; status: string }) {
  return { success: true, data: null, error: null };
}
"@
    $machinesContent | Set-Content -Path "$actionsSrc\machines.ts" -Encoding utf8

    # reverse-engineering.ts
    $reverseContent = @"
'use client';

export async function updateREProjectStatus(input: unknown) {
  return { success: true, data: null, error: null };
}

export async function addREStep(input: { projectId: string; name: string; description?: string; order: number }) {
  return { 
    success: true, 
    data: {
      id: 'mock-' + Date.now(),
      projectId: input.projectId,
      name: input.name,
      description: input.description || '',
      order: input.order,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, 
    error: null 
  };
}

export async function updateREStep(input: unknown) {
  return { success: true, data: null, error: null };
}

export async function addCadFile(input: unknown) {
  return { success: true, data: null, error: null };
}

export async function updateCadFile(input: unknown) {
  return { success: true, data: null, error: null };
}

export async function deleteCadFile(input: { id: string }) {
  return { success: true, data: null, error: null };
}
"@
    $reverseContent | Set-Content -Path "$actionsSrc\reverse-engineering.ts" -Encoding utf8

    Write-Host "Mocks Server Actions crees"
}

function Restore-Real-Actions {
    $backupPath = "$repoRoot\disabled-pages\lib-actions-backup"
    if (Test-Path $backupPath) {
        if (Test-Path $actionsSrc) {
            Remove-Item -Recurse -Force $actionsSrc
        }
        Move-Item $backupPath $actionsSrc -Force
        Write-Host "Vraies Server Actions restaurees depuis backup"
    }
    else {
        Write-Host "Pas de backup trouve, actions non restaurees"
    }
}

try {
    Write-Host "Build Desktop PartIVA"
    
    # 1. Backup real Server Actions
    Backup-Actions
    
    # 2. Create mock Server Actions (no 'use server')
    Create-Mock-Actions
    
    # 2. Build Next.js (export)
    Write-Host "Build Next.js..."
    cd $repoRoot
    $env:NEXT_EXPORT = "true"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build Next.js echoue" }
    
    # 3. Build Tauri
    Write-Host "Build Tauri..."
    cd "$repoRoot\desktop"
    npx tauri build
    if ($LASTEXITCODE -ne 0) { throw "Build Tauri echoue" }
    
    Write-Host "Build Desktop termine avec succes"
}
finally {
    if (-not $SkipRestore) {
        # Restore real Server Actions
        Restore-Real-Actions
    }
}