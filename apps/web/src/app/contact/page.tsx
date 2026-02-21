'use client';

import { useState, useEffect, FormEvent } from 'react';

export default function ContactPage() {
  useEffect(() => { document.title = 'Contact | Gigs.ma'; }, []);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // For now, just show success message
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <div className="card">
            <div className="card-body" style={{ padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#10003;</div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Message envoye !</h1>
              <p style={{ color: '#6b7280' }}>
                Merci pour votre message. Notre equipe vous repondra dans les plus brefs delais.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 600 }}>
        <h1 className="section-title">Contactez-nous</h1>

        <div className="card">
          <div className="card-body" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Votre nom"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="votre@email.com"
                />
              </div>
              <div className="form-group">
                <label>Sujet</label>
                <select
                  className="form-input"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                >
                  <option value="">Selectionnez un sujet</option>
                  <option value="general">Question generale</option>
                  <option value="booking">Probleme de reservation</option>
                  <option value="account">Mon compte</option>
                  <option value="provider">Devenir prestataire</option>
                  <option value="bug">Signaler un bug</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  className="form-input"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                  placeholder="Decrivez votre demande..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Envoyer
              </button>
            </form>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
          <p>Vous pouvez aussi nous contacter par email a <strong>contact@gigs.ma</strong></p>
        </div>
      </div>
    </section>
  );
}
