import { listOperatorClients } from './lib/operator-data.js';

async function main() {
    try {
        const clients = await listOperatorClients();
        console.log(JSON.stringify(clients.slice(0, 5), null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
