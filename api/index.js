const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');

// On ne charge le .env que si on n'est pas en mode test (pour éviter le bruit dans Jest)
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Initialisation de Prisma
const prisma = new PrismaClient();

// Middlewares de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.send('API DevSecOps opérationnelle !');
});

// Route 1 : Health Check (Q30)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "L'API est opérationnelle",
    timestamp: new Date().toISOString()
  });
});

// Route 2 : Profil du Portfolio (Q31)
app.get('/api/profile', (req, res) => {
  res.status(200).json({
    name: "Arij Belaid",
    title: "Étudiante en Master Pro DevOps & Cloud",
    location: "Tunisie",
    email: "aarijbelaid@gmail.com",
    github: "https://github.com/arijbelaid",
    bio: "Passionnée par l'automatisation, les systèmes Linux et les architectures cloud."
  });
});

// Route 3 : Liste des projets (Q32)
app.get('/api/projects', (req, res) => {
  const projects = [
    {
      slug: "cicd-ubuntu-server",
      title: "Chaîne CI/CD complète sur Ubuntu Server",
      description: "Installation et durcissement d'un serveur Ubuntu Server 26.04, déploiement de Docker et Jenkins.",
      tags: ["Ubuntu", "Docker", "Jenkins", "SSH", "UFW"],
      year: "2026"
    },
    {
      slug: "devsecops-portfolio-nextjs",
      title: "DevSecOps Portfolio (ce site)",
      description: "Application one-page responsive développée en Next.js 16 et Tailwind CSS.",
      tags: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      year: "2026"
    },
    {
      slug: "application-gestion-php",
      title: "Application web de gestion",
      description: "Développement d'une application de gestion avec base de données MySQL (PHP/JS).",
      tags: ["PHP", "MySQL", "HTML/CSS", "JavaScript"],
      year: "2025"
    }
  ];
  res.status(200).json(projects);
});

// Route 4 : Liste des compétences (Q33)
app.get('/api/skills', (req, res) => {
  const skills = [
    {
      category: "DevOps & Cloud",
      items: ["Docker", "Jenkins", "Git / GitHub", "CI/CD", "Linux (Ubuntu Server)"]
    },
    {
      category: "Développement",
      items: ["HTML5 / CSS3", "JavaScript / TypeScript", "React / Next.js", "Python", "Java"]
    }
  ];
  res.status(200).json(skills);
});

// Schéma de validation Zod (Q48)
const contactSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(50, "Le nom est trop long."),
  email: z.string().email("L'adresse email n'est pas valide."),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères.").max(1000, "Le message est trop long.")
});

// Rate Limiting (Q51)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { status: "error", message: "Trop de requêtes. Veuillez réessayer dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Route 5 : Formulaire de contact avec Prisma (Q46 + Q48 + Q51 + Q54 + Q55)
app.post('/api/contact', contactLimiter, async (req, res, next) => {
  const result = contactSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      status: "error",
      message: "Données invalides.",
      errors: result.error.issues.map(err => ({ champ: err.path[0], message: err.message }))
    });
  }

  const { nom, email, message } = result.data;

  try {
    const newContact = await prisma.contact.create({
      data: { nom, email, message },
    });

    console.log(`📩 Message Prisma enregistré de ${nom}`);
    res.status(200).json({
      status: "success",
      message: "Votre message a bien été reçu et enregistré !",
      data: newContact
    });
  } catch (error) {
    next(error);
  }
});

// Route de test erreur (Q49)
app.get('/api/test-error', (req, res, next) => {
  const error = new Error("Erreur fatale simulée.");
  error.statusCode = 500;
  next(error);
});

// Middleware d'erreur centralisé (Q49)
app.use((err, req, res, next) => {
  console.error(`💥 Erreur interceptée : ${err.message}`);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Une erreur interne est survenue.",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Exporter l'application pour les tests
module.exports = app;


// Lancer le serveur uniquement si on n'est pas en mode test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`);
  });
}
