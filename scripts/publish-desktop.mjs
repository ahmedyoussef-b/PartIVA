/**
 * publish-desktop.mjs
 *
 * Script d'automatisation pour publier les installeurs Desktop générés par Tauri
 * vers Vercel Blob et enregistrer leurs métadonnées dans Prisma via l'API auto-save.
 *
 * Usage :
 *   node scripts/publish-desktop.mjs <bundleDir> <version> <os> [apiBaseUrl] [releaseApiSecret]
 *
 * Exemple :
 *   node scripts/publish-desktop.mjs ./desktop/src-tauri/target/release/bundle v1.0.0 windows \
 *     https://part-iva.vercel.app ${RELEASE_API_SECRET}
 *
 * Variables d'environnement requises :
 *   BLOB_READ_WRITE_TOKEN — token d'écriture Vercel Blob
 */

import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const bundleDir = process.argv[2];
const version = process.argv[3];
const targetOs = process.argv[4];
const apiBaseUrl = process.argv[5];
const releaseApiSecret = process.argv[6];

const INSTALLER_EXTENSIONS = ['.exe', '.msi', '.dmg', '.appimage', '.deb'];

if (!bundleDir || !version || !targetOs) {
  console.error(
    'Usage: publish-desktop.mjs <bundleDir> <version> <os> [apiBaseUrl] [releaseApiSecret]',
  );
  process.exit(1);
}

if (!fs.existsSync(bundleDir) || !fs.statSync(bundleDir).isDirectory()) {
  console.error(`Répertoire introuvable : ${bundleDir}`);
  process.exit(1);
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN non défini');
  process.exit(1);
}

function findInstallerFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findInstallerFiles(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (INSTALLER_EXTENSIONS.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const files = findInstallerFiles(bundleDir);

if (files.length === 0) {
  console.error(`Aucun installeur trouvé dans ${bundleDir}`);
  process.exit(1);
}

console.log(`${files.length} installeur(s) trouvé(s) dans ${bundleDir}`);

async function main() {
  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const stat = fs.statSync(filePath);
    const fileType = path.extname(fileName).toLowerCase().replace('.', '') ?? 'bin';

    console.log(`Upload de ${fileName} (${(stat.size / 1024 / 1024).toFixed(2)} Mo)...`);

    const fileStream = fs.createReadStream(filePath);

    let blobUrl;
    try {
      const blob = await put(fileName, fileStream, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      blobUrl = blob.url;
    } catch (err) {
      console.error(`Échec de l'upload de ${fileName}:`, err);
      process.exit(1);
    }

    console.log(`→ ${fileName} publié sur ${blobUrl}`);

    if (apiBaseUrl && releaseApiSecret) {
      try {
        const res = await fetch(`${apiBaseUrl}/api/desktop-builds/auto-save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${releaseApiSecret}`,
          },
          body: JSON.stringify({
            version,
            os: targetOs,
            fileType,
            fileUrl: blobUrl,
            fileSize: stat.size,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(
            `Échec de l'enregistrement des métadonnées pour ${fileName}: ${res.status} ${text}`,
          );
          process.exit(1);
        }

        const data = await res.json();
        console.log(`→ Métadonnées enregistrées (id: ${data.id})`);
      } catch (err) {
        console.error(`Erreur lors de l'appel à l'API auto-save pour ${fileName}:`, err);
        process.exit(1);
      }
    } else {
      console.log('→ (métadonnées non enregistrées : apiBaseUrl ou releaseApiSecret manquant)');
    }
  }

  console.log('Publication terminée avec succès.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
