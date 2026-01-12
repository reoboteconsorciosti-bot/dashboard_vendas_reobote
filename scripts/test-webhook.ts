
const N8N_TOKEN = process.env.N8N_WEBHOOK_TOKEN || "SEU_TOKEN_AQUI"; // Replace if needed or set in env
const BASE_URL = "http://localhost:3000/api/webhook/n8n";

async function sendWebhook(name: string, payload: any) {
    console.log(`\n--- Teste: ${name} ---`);
    try {
        const res = await fetch(BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${N8N_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Erro na requisição:", err);
    }
}

async function runTests() {
    // Test 1: Single New Sale
    await sendWebhook("1. Criar Venda Única", {
        consultorNome: "Consultor Teste",
        administradora: "Reobote",
        grupo: "G100",
        cota: "C001",
        valorLiquido: 10000.00,
        valorBruto: 12000.00,
        dataVenda: "2024-01-01"
    });

    // Test 2: Update Same Sale (Change Value)
    await sendWebhook("2. Atualizar Venda Existente", {
        consultorNome: "Consultor Teste",
        administradora: "Reobote",
        grupo: "G100",
        cota: "C001", // Same key
        valorLiquido: 15000.00, // Changed
        valorBruto: 12000.00,
        dataVenda: "2024-01-01"
    });

    // Test 3: Bulk Mix (1 Update, 1 New)
    await sendWebhook("3. Bulk: 1 Update + 1 Nova", [
        {
            consultorNome: "Consultor Teste",
            administradora: "Reobote",
            grupo: "G100",
            cota: "C001", // Update again
            valorLiquido: 20000.00,
            valorBruto: 12000.00,
            dataVenda: "2024-01-01"
        },
        {
            consultorNome: "Novo Consultor",
            administradora: "Bradesco",
            grupo: "G200",
            cota: "C002", // New
            valorLiquido: 50000.00,
            valorBruto: 60000.00,
            dataVenda: "2024-01-02"
        }
    ]);
}

runTests();
