import React from 'react';

const LAST_UPDATED = '1 Temmuz 2025';
const EMAIL = 'help@zetstudiointl.com';

const COOKIE_TABLE = [
  { name: 'zet_session', type: 'Zorunlu', purpose: 'Kullanıcı oturum yönetimi', duration: 'Oturum süresi' },
  { name: 'zet_cookie_consent', type: 'Zorunlu', purpose: 'Çerez tercihlerini hatırlama', duration: '1 yıl' },
  { name: '_ga, _gid', type: 'Analitik', purpose: 'Google Analytics (anonim kullanım istatistikleri)', duration: '2 yıl / 24 saat' },
];

const SECTIONS = [
  {
    id: 'cerez-nedir',
    title: '1. Çerez Nedir?',
    content: 'Çerezler, web sitelerinin tarayıcınıza küçük metin dosyaları olarak yerleştirdiği ve oturum bilgilerini ya da tercihlerinizi hatırlamak için kullandığı veri parçacıklarıdır.',
  },
  {
    id: 'kullandigimiz-cerezler',
    title: '2. Kullandığımız Çerezler',
  },
  {
    id: 'zorunlu',
    title: '3. Zorunlu Çerezler',
    content: 'Oturum açma, güvenlik ve temel işlevsellik için zorunlu çerezler kullanılır. Bu çerezler kapatılamaz; platform onlarsız çalışamaz.',
  },
  {
    id: 'analitik',
    title: '4. Analitik Çerezler',
    content: 'Hangi özelliklerin daha fazla kullanıldığını anlamak için anonim kullanım verileri toplayan analitik çerezler kullanılabilir. Bu çerezler için onayınız alınır; onay vermezseniz analitik çerezler aktif edilmez.',
  },
  {
    id: 'kontrol',
    title: '5. Çerez Tercihlerinizi Yönetme',
    content: `Çerez tercihlerinizi istediğiniz zaman değiştirebilirsiniz:\n• Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz\n• Sayfanın altındaki çerez onay bannerı üzerinden tercihlerinizi güncelleyebilirsiniz\n• ${EMAIL} adresine yazarak talebinizi iletebilirsiniz\n\nZorunlu çerezler kapatılamaz; bunları kaldırmak platforma erişimi engelleyebilir.`,
  },
  {
    id: 'iletisim',
    title: '6. İletişim',
    content: `Çerez politikamızla ilgili sorularınız için ${EMAIL} adresine ulaşabilirsiniz.`,
  },
];

export default function Cookies() {
  return (
    <div style={{ paddingTop: 'var(--header-h)' }}>
      <div className="legal-wrap">
        <aside className="legal-toc">
          <h4>İçindekiler</h4>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}>{s.title}</a>
          ))}
        </aside>
        <div className="legal-content">
          <h1>Çerez Politikası</h1>
          <p className="last-updated">Son güncelleme: {LAST_UPDATED}</p>
          {SECTIONS.map(s => (
            <div key={s.id} id={s.id}>
              <h2>{s.title}</h2>
              {s.id === 'kullandigimiz-cerezler' ? (
                <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Çerez Adı','Tür','Amaç','Süre'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 600, fontSize: 12, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COOKIE_TABLE.map(r => (
                        <tr key={r.name} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 13 }}>{r.name}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.type}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.purpose}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : s.content ? (
                <>
                  {s.content.split('\n').filter(l => !l.startsWith('•')).map((line, i) => <p key={i}>{line}</p>)}
                  {s.content.includes('•') && (
                    <ul>
                      {s.content.split('\n').filter(l => l.startsWith('•')).map((l, i) => (
                        <li key={i}>{l.replace('• ', '')}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
