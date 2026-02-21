import Link from 'next/link';

export default function AboutPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title">A propos de Gigs.ma</h1>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body" style={{ padding: '2rem', lineHeight: 1.8 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Notre mission</h2>
            <p style={{ marginBottom: '1rem' }}>
              Gigs.ma est la premiere marketplace de services a domicile au Maroc. Notre mission est de
              connecter les particuliers avec les meilleurs prestataires de services de leur ville,
              de maniere simple, rapide et fiable.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              Que vous ayez besoin d&apos;un plombier, d&apos;un electricien, d&apos;un service de menage,
              d&apos;un demenagement ou de tout autre service, Gigs.ma vous permet de trouver le bon
              professionnel en quelques clics.
            </p>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>Comment ca marche ?</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', margin: '1.5rem 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>1</div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Recherchez</div>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Parcourez les services disponibles dans votre ville</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>2</div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Reservez</div>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Choisissez votre prestataire et reservez en ligne</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>3</div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Profitez</div>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Le prestataire vient chez vous, vous payez apres le service</p>
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>Pour les prestataires</h2>
            <p style={{ marginBottom: '1rem' }}>
              Vous etes professionnel ? Rejoignez Gigs.ma pour augmenter votre visibilite,
              recevoir des reservations et developper votre activite. L&apos;inscription est gratuite.
            </p>
            <Link href="/auth/register" className="btn btn-primary">Devenir prestataire</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
