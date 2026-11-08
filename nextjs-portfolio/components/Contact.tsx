"use client";

import { useState } from "react";
import { contactsData } from "@/data";

export default function Contact() {
  const [formData, setFormData] = useState({ nom: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Envoi en cours...");

    try {
      // On utilise l'IP de ta VM (remplace 192.168.159.129 par ton IP actuelle si elle a changé)
      const res = await fetch("http://192.168.159.129:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ Message envoyé avec succès !");
        setFormData({ nom: "", email: "", message: "" }); // Vider le formulaire
      } else {
        setStatus(`❌ Erreur : ${data.message}`);
      }
    } catch (error) {
      setStatus("❌ Erreur réseau. Impossible de joindre le serveur.");
    }
  };

  return (
    <section id="contact" className="scroll-mt-24 py-20">
      <h2 className="text-2xl font-bold text-white mb-8">
        <span className="text-cyan-400 font-mono text-xl">05.</span> Contact
      </h2>

      {/* Coordonnées existantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {contactsData.map((contact) => (
          <a
            key={contact.label}
            href={contact.href}
            className="block p-4 border border-slate-700 rounded-lg hover:border-cyan-400 transition-colors"
          >
            <p className="text-slate-400 text-sm">{contact.label}</p>
            <p className="text-cyan-400 font-medium">{contact.value}</p>
          </a>
        ))}
      </div>

      {/* Le nouveau formulaire */}
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-slate-300 mb-2">Votre nom</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white focus:border-cyan-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-2">Votre email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white focus:border-cyan-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-2">Votre message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white focus:border-cyan-400 outline-none"
          ></textarea>
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded hover:bg-cyan-400 transition-colors"
        >
          Envoyer le message
        </button>

        {status && <p className="mt-4 text-cyan-400 font-mono">{status}</p>}
      </form>
    </section>
  );
}
