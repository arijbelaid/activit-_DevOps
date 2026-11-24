"use client";

import { apiFetch } from "../lib/apiFetch";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Project {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  year: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. On crée un contrôleur pour pouvoir annuler la requête si besoin
    const controller = new AbortController();

    // 2. On passe le signal au fetch
    apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des projets");
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        // 3. On ignore l'erreur si c'est une annulation normale (React Strict Mode)
        if (err.name !== "AbortError") {
          console.error(err);
          setError(err.message);
          setLoading(false);
        }
      });

    // 4. Si le composant est démonté, on annule la requête
    return () => controller.abort();
  }, []);

  if (loading) return <div className="text-center py-10 text-cyan-400">⏳ Chargement des projets depuis l'API...</div>;
  if (error) return <div className="text-center py-10 text-red-500">❌ Erreur : {error}</div>;

  return (
    <section id="projects" className="scroll-mt-24">
      <h2 className="text-3xl font-bold mb-6 border-b border-slate-700 pb-2">
        <span className="text-cyan-400 font-mono text-xl">03.</span> Projects
      </h2>
      <div className="space-y-4">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="block bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-cyan-400 transition group"
          >
            <h3 className="font-semibold text-lg group-hover:text-cyan-400 transition">
              {project.title}
            </h3>
            <p className="text-slate-400 text-sm mt-2">{project.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
