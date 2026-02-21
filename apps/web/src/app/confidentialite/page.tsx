export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title">Politique de Confidentialite</h1>

        <div className="card">
          <div className="card-body" style={{ padding: '2rem', lineHeight: 1.8 }}>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Derniere mise a jour : 21 fevrier 2026</p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Donnees collectees</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Nous collectons les donnees suivantes lors de votre utilisation de Gigs.ma :
              nom, adresse email, numero de telephone, ville, adresse de prestation,
              et les donnees de navigation (cookies techniques).
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>2. Utilisation des donnees</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Vos donnees sont utilisees pour : gerer votre compte, faciliter les reservations,
              permettre la communication entre clients et prestataires, ameliorer nos services,
              et vous envoyer des notifications liees a vos reservations.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>3. Partage des donnees</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Vos donnees personnelles ne sont jamais vendues a des tiers. Elles peuvent etre
              partagees avec : le prestataire ou client concerne par une reservation, nos
              sous-traitants techniques, et les autorites competentes si requis par la loi.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>4. Securite</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Nous mettons en oeuvre des mesures techniques et organisationnelles pour proteger
              vos donnees : chiffrement des mots de passe, connexions HTTPS, acces restreint
              aux donnees personnelles.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>5. Vos droits</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Conformement a la loi 09-08 relative a la protection des personnes physiques
              a l&apos;egard du traitement des donnees a caractere personnel, vous disposez d&apos;un
              droit d&apos;acces, de rectification et de suppression de vos donnees. Pour exercer
              ces droits, contactez-nous a : privacy@gigs.ma
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>6. Cookies</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Nous utilisons des cookies techniques necessaires au fonctionnement de la plateforme.
              Ces cookies sont essentiels pour maintenir votre session de connexion et memoriser
              vos preferences.
            </p>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem' }}>7. Contact</h2>
            <p>
              Pour toute question relative a la protection de vos donnees, contactez notre
              Delegue a la Protection des Donnees a : privacy@gigs.ma
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
