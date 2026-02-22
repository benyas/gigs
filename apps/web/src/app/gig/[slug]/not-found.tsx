import Link from 'next/link';

export default function GigNotFound() {
  return (
    <section className="section">
      <div className="container">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">Service non trouve</div>
            <div className="empty-state-desc">Ce service n&apos;existe pas ou a ete supprime.</div>
            <Link href="/browse" className="btn btn-primary">Parcourir les services</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
