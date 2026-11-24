"use client";

import { apiFetch } from "../lib/apiFetch";
import { useState, useEffect } from "react";

interface SkillGroup {
  category: string;
  items: string[];
}

export default function Skills() {
  const [skills, setSkills] = useState<SkillGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Création du contrôleur pour pouvoir annuler la requête
    const controller = new AbortController();

    // 2. Appel à l'API avec le signal d'annulation
    apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/skills`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur de récupération");
        return res.json();
      })
      .then((data) => {
        setSkills(data);
        setLoading(false);
      })
      .catch((err) => {
        // 3. On ignore l'erreur si c'est une annulation normale (React Strict Mode)
        if (err.name !== "AbortError") {
          console.error(err);
          setLoading(false);
        }
      });

    // 4. Nettoyage : on annule la requête si le composant est démonté
    return () => controller.abort();
  }, []);

  if (loading) return <div className="text-center py-10 text-cyan-400">⏳ Chargement des compétences depuis l'API...</div>;

  return (
    <section id="skills" className="scroll-mt-24">
      <h2 className="text-3xl font-bold mb-6 border-b border-slate-700 pb-2">
        <span className="text-cyan-400 font-mono text-xl">02.</span> Skills
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {skills.map((group) => (
          <div key={group.category} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3 text-cyan-400">{group.category}</h3>
            <ul className="space-y-1 text-slate-300">
              {group.items.map((item) => (
                <li key={item}>▸ {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
