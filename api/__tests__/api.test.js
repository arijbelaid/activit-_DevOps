const request = require('supertest');
const app = require('../index');

describe('Tests de l\'API Express', () => {
  
  // --- TESTS FONCTIONNELS (Q58) ---
  
  it('GET /api/health - doit renvoyer un statut 200 et le statut OK', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('message', "L'API est opérationnelle");
  });

  it('GET /api/projects - doit renvoyer une liste de projets', async () => {
    const res = await request(app).get('/api/projects');
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  // --- TESTS DE SÉCURITÉ (Q59) ---

  it('POST /api/contact - doit rejeter une requête malformée (champs manquants)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ nom: "Arij" }); // Il manque l'email et le message
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual("error");
    expect(res.body.message).toEqual("Données invalides.");
  });

  it('POST /api/contact - doit rejeter des entrées invalides (format email incorrect)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ 
        nom: "Arij", 
        email: "ceci-nest-pas-un-email", 
        message: "Ceci est un message valide de plus de 10 caractères." 
      });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0].champ).toEqual("email");
    expect(res.body.errors[0].message).toEqual("L'adresse email n'est pas valide.");
  });

  it('POST /api/contact - doit résister aux tentatives d\'injection (SQL/XSS)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ 
        nom: "Hacker", 
        email: "test@test.com' OR '1'='1", 
        message: "<script>alert('hack')</script> Ceci est un message." 
      });
    
    // Zod bloque car l'email n'est pas valide (à cause des quotes)
    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual("error");
  });

});
