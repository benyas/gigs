export default function GigLoading() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 1000 }}>
        <div className="skeleton" style={{ height: 16, width: 150, marginBottom: '1rem' }} />
        <div className="gig-layout">
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="skeleton" style={{ height: 320, borderRadius: 0 }} />
              <div style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem' }}>
                  <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 12 }} />
                  <div className="skeleton" style={{ height: 24, width: 100, borderRadius: 12 }} />
                </div>
                <div className="skeleton" style={{ height: 28, width: '80%', marginBottom: '1rem' }} />
                <div className="skeleton" style={{ height: 60, marginBottom: '1.5rem' }} />
                <div className="skeleton" style={{ height: 120 }} />
              </div>
            </div>
          </div>
          <div>
            <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
