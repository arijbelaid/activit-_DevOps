const { z } = require('zod');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Route de base pour tester
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
  nom: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(50, "Le nom est trop long."),
  email: z.string()
    .email("L'adresse email n'est pas valide."),
  message: z.string()
    .min(10, "Le message doit contenir au moins 10 caractères.")
    .max(1000, "Le message est trop long (max 1000 caractères).")
});

// Route 5 : Formulaire de contact (Q46 + Q48)
app.post('/api/contact', (req, res) => {
  // Validation stricte avec Zod
  const result = contactSchema.safeParse(req.body);

  // Si la validation échoue, on renvoie une erreur 400
  if (!result.success) {
    return res.status(400).json({
      status: "error",
      message: "Données invalides.",
      errors: result.error.errors.map(err => ({
        champ: err.path[0],
        message: err.message
      }))
    });
  }

  // Si la validation réussit, on utilise les données validées
  const { nom, email, message } = result.data;

  console.log(`📩 Nouveau message de ${nom} (${email}) : ${message}`);
  
  res.status(200).json({
    status: "success",
    message: "Votre message a bien été reçu !",
    data: { nom, email, message }
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`);
});
