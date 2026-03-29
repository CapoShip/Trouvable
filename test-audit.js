import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function run() {
    const sourcePath = path.join(process.cwd(), 'lib', 'audit', 'scanner.js');
    const tempPath = path.join(process.cwd(), 'lib', 'audit', `.scanner-runtime-${Date.now()}.mjs`);
    const code = fs.readFileSync(sourcePath, 'utf8').replace("import 'server-only';", '// removed');
    fs.writeFileSync(tempPath, code);

    try {
        const { runSiteAudit } = await import(pathToFileURL(tempPath).href);
        console.log('Running audit...');
        const res = await runSiteAudit('https://www.trouvable.app/');
        console.log(JSON.stringify(res, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        fs.rmSync(tempPath, { force: true });
    }
}

run();
