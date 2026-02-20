export default function OfflinePage() {
  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
        <h1 style={{ marginBottom: '1rem' }}>Vous êtes hors ligne</h1>
        <p style={{ color: '#6b7280', maxWidth: 400, margin: '0 auto' }}>
          Vérifiez votre connexion internet et réessayez. Certaines fonctionnalités
          sont disponibles hors ligne.
        </p>
      </div>
    </section>
  );
}
