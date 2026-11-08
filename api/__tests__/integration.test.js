const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Test d\'intégration : Frontend -> API -> PostgreSQL', () => {
  
  it('doit recevoir une requête du frontend et enregistrer les données dans PostgreSQL', async () => {
    // On génère un email unique pour ce test
    const uniqueEmail = `test-integration-${Date.now()}@test.com`;
    
    const payload = {
      nom: "Test Integration",
      email: uniqueEmail,
      message: "Ceci est un message de test d'intégration complet."
    };

    // 1. SIMULATION DU FRONTEND : on envoie la requête à l'API
    const res = await request(app)
      .post('/api/contact')
      .send(payload);

    // On vérifie que l'API a répondu avec succès
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual("success");

    // 2. VÉRIFICATION DANS POSTGRESQL : on utilise Prisma pour chercher la donnée
      const savedContact = await prisma.contact.findFirst({
      where: { email: uniqueEmail }
    });

    // On vérifie que la donnée existe bien en base
    expect(savedContact).not.toBeNull();
    expect(savedContact.nom).toEqual(payload.nom);
    expect(savedContact.message).toEqual(payload.message);
  });

  // Fermeture de la connexion Prisma après les tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

});
