import fs from 'fs';

async function run() {
    const code = fs.readFileSync('lib/audit/scanner.js', 'utf8').replace("import 'server-only';", "// removed");
    fs.writeFileSync('lib/audit/scanner-temp.js', code);
    const { runSiteAudit } = await import('./lib/audit/scanner-temp.js');
    console.log("Running audit...");
    try {
        const res = await runSiteAudit('https://www.trouvable.app/');
        console.log(JSON.stringify(res, null, 2));
    } catch(err) {
        console.error(err);
    }
}
run();
