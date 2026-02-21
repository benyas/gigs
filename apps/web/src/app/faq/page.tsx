'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'Qu\'est-ce que Gigs.ma ?',
        a: 'Gigs.ma est une marketplace de services a domicile au Maroc. Nous connectons les particuliers avec des prestataires de services qualifies dans leur ville.',
      },
      {
        q: 'L\'inscription est-elle gratuite ?',
        a: 'Oui, l\'inscription est entierement gratuite pour les clients et les prestataires.',
      },
      {
        q: 'Dans quelles villes etes-vous presents ?',
        a: 'Nous sommes presents dans les principales villes du Maroc : Casablanca, Rabat, Marrakech, Tanger, Fes, Agadir, et d\'autres villes a venir.',
      },
    ],
  },
  {
    category: 'Pour les clients',
    questions: [
      {
        q: 'Comment reserver un service ?',
        a: 'Parcourez les services disponibles, selectionnez celui qui vous convient, choisissez une date et une heure, indiquez votre adresse et confirmez la reservation.',
      },
      {
        q: 'Comment annuler une reservation ?',
        a: 'Vous pouvez annuler une reservation depuis votre tableau de bord tant qu\'elle est en statut "en attente". Si le prestataire a deja accepte, contactez-le via la messagerie.',
      },
      {
        q: 'Comment laisser un avis ?',
        a: 'Apres la realisation du service (statut "termine"), un formulaire d\'evaluation apparait dans vos reservations. Vous pouvez noter le prestataire de 1 a 5 etoiles et laisser un commentaire.',
      },
      {
        q: 'Comment contacter un prestataire ?',
        a: 'Utilisez la messagerie integree pour communiquer directement avec le prestataire avant ou apres la reservation.',
      },
    ],
  },
  {
    category: 'Pour les prestataires',
    questions: [
      {
        q: 'Comment proposer mes services ?',
        a: 'Inscrivez-vous en tant que prestataire, completez votre profil, puis creez vos services avec une description, un prix et votre zone d\'intervention.',
      },
      {
        q: 'Comment recevoir des reservations ?',
        a: 'Une fois vos services publies, les clients peuvent vous reserver directement. Vous recevez une notification pour chaque nouvelle reservation.',
      },
      {
        q: 'Comment gerer mes reservations ?',
        a: 'Depuis votre tableau de bord, vous pouvez accepter, demarrer ou terminer vos reservations. Maintenez un bon taux d\'acceptation pour ameliorer votre visibilite.',
      },
      {
        q: 'Comment obtenir le badge verifie ?',
        a: 'Le badge verifie est attribue par notre equipe apres verification de votre identite et de vos qualifications professionnelles.',
      },
    ],
  },
  {
    category: 'Paiement et securite',
    questions: [
      {
        q: 'Comment se fait le paiement ?',
        a: 'Le paiement se fait directement entre le client et le prestataire apres la realisation du service. Gigs.ma ne prend aucune commission sur les transactions.',
      },
      {
        q: 'Mes donnees sont-elles en securite ?',
        a: 'Oui, nous utilisons le chiffrement des donnees et les meilleures pratiques de securite pour proteger vos informations personnelles.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  function toggle(key: string) {
    setOpenIndex(openIndex === key ? null : key);
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title">Questions Frequentes</h1>

        {faqs.map((section) => (
          <div key={section.category} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
              {section.category}
            </h2>
            {section.questions.map((faq, i) => {
              const key = `${section.category}-${i}`;
              const isOpen = openIndex === key;
              return (
                <div key={key} className="card" style={{ marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => toggle(key)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '1rem 1.25rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontWeight: 600, fontSize: '0.95rem', color: '#111',
                    }}
                  >
                    {faq.q}
                    <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0 }}>
                      &#9662;
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.25rem 1rem', color: '#4b5563', lineHeight: 1.7 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              Vous n&apos;avez pas trouve la reponse a votre question ?
            </p>
            <Link href="/contact" className="btn btn-primary">Contactez-nous</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
