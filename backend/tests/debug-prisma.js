const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Bill model fields...');
    // Inspect the DMMF (Data Model Meta Format) if accessible, or just try to access the model
    // Note: DMMF is usually available on Prisma.dmmf or via getDmmf

    // Alternative: check the keys of the delegate
    console.log('Bill Delegate keys:', Object.keys(prisma.bill));

    // Trying to see if we can introspect the model definition from runtime
    // (Not directly exposed easily in runtime without dmmf)

    // Let's try to create a dummy bill and see if types allow it (this is JS so types don't matter at compile time, but we can catch the error)
    // We won't actually create it, just print that we are ready.

    // Actually, we can check the dmmf property on the client constructor if available
    const dmmf = prisma._baseDmmf || prisma._dmmf;
    if (dmmf) {
        const billModel = dmmf.datamodel.models.find(m => m.name === 'Bill');
        if (billModel) {
            console.log('Bill Model Fields:', billModel.fields.map(f => f.name));
        } else {
            console.log('Bill Model not found in DMMF');
        }
    } else {
        console.log('DMMF not accessible directly');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
