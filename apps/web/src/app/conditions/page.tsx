import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Generales d\'Utilisation',
  description: 'Conditions generales d\'utilisation de la plateforme Gigs.ma.',
};

export default function TermsPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title">Conditions Generales d&apos;Utilisation</h1>

        <div className="card">
          <div className="card-body" style={{ padding: '2rem', lineHeight: 1.8 }}>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Derniere mise a jour : 21 fevrier 2026</p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Objet</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Les presentes conditions generales d&apos;utilisation (CGU) regissent l&apos;acces et
              l&apos;utilisation de la plateforme Gigs.ma. En accedant a la plateforme, vous acceptez
              sans reserve les presentes CGU.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>2. Services</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Gigs.ma est une plateforme de mise en relation entre des particuliers (clients) et
              des prestataires de services. Gigs.ma n&apos;est pas partie prenante aux contrats
              conclus entre les clients et les prestataires.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>3. Inscription</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              L&apos;inscription est gratuite et ouverte a toute personne physique agee de 18 ans minimum.
              Chaque utilisateur doit fournir des informations exactes et les maintenir a jour.
              Un seul compte par personne est autorise.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>4. Obligations des prestataires</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Les prestataires s&apos;engagent a fournir des services de qualite, a respecter les
              rendez-vous pris, a maintenir une communication professionnelle et a disposer de
              toutes les qualifications et autorisations necessaires pour les services proposes.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>5. Obligations des clients</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Les clients s&apos;engagent a fournir des informations exactes lors de la reservation,
              a etre presents au rendez-vous ou a annuler dans les delais prevus, et a effectuer
              le paiement convenu pour les services rendus.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>6. Avis et evaluations</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Les clients peuvent laisser un avis apres chaque prestation. Les avis doivent
              etre honnetes, respectueux et bases sur une experience reelle. Gigs.ma se reserve
              le droit de supprimer les avis inappropries.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>7. Responsabilite</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Gigs.ma agit en tant qu&apos;intermediaire et ne peut etre tenu responsable de la
              qualite des services fournis par les prestataires, ni des litiges entre clients
              et prestataires. En cas de litige, nous proposons un service de mediation.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>8. Contact</h2>
            <p>
              Pour toute question relative aux presentes CGU, contactez-nous a : contact@gigs.ma
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
