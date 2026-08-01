import React from 'react';

const LAST_UPDATED = '1 Ağustos 2026';
const EMAIL = 'help@zetstudiointl.com';

const SECTIONS = [
  {
    id: 'toplanan-veriler',
    title: '1. Toplanan Veriler',
    content: `Hizmetimizi kullanırken şu veriler toplanır:\n• Hesap bilgileri: E-posta adresi, tercihler, ayarlar\n• İçerik verileri: Belgeler, notlar, canvas içerikleri\n• Kullanım verileri: Hangi özelliklerin ne sıklıkta kullanıldığı (anonim)\n• Teknik veriler: IP adresi, tarayıcı türü, platform bilgisi\n\nKredi kartı numaraları gibi hassas ödeme verileri tarafımızca saklanmaz; ödeme işlemleri Paddle tarafından güvenli biçimde yürütülür.`,
  },
  {
    id: 'kullanim-amaci',
    title: '2. Verilerin Kullanım Amacı',
    content: `Topladığımız verileri şu amaçlarla kullanırız:\n• Hizmetlerimizi sunmak ve sürdürmek\n• Hesabınızı yönetmek ve abonelik işlemlerini gerçekleştirmek\n• Hizmet kalitesini artırmak için anonim analiz yapmak\n• Güvenlik tehditlerini tespit etmek ve önlemek\n• Yasal yükümlülükleri yerine getirmek\n\nVerilerinizi başkalarına satmıyoruz, kiralamıyoruz ve pazarlama amaçlı üçüncü taraflarla paylaşmıyoruz. Mahkeme kararı veya yasal zorunluluk halinde yetkili mercilerle paylaşım yapılabilir.\n\nHizmet kalitesini artırmak amacıyla anonim ve anonimleştirilmiş veriler gelecekte model iyileştirmesinde kullanılabilir. Bu durumda kişisel tanımlamaya olanak tanıyacak hiçbir veri işlenmez.`,
  },
  {
    id: 'ai-veriler',
    title: '3. AI ve İçerik Gizliliği',
    content: `Zeta AI asistanına ilettiğiniz mesajlar ve belgeler, yapay zeka modelini eğitmek amacıyla kullanılmaz. Belgeleriniz yalnızca sizin oturumunuzda işlenir.\n\nAI özelliklerini kullanırken ilettiğiniz içerikler, yapay zeka hizmet sağlayıcısı altyapıları üzerinden işlenebilir. Bu sağlayıcıların kendi gizlilik politikaları geçerlidir.`,
  },
  {
    id: 'depolama',
    title: '4. Veri Depolama ve Güvenlik',
    content: `Belgeleriniz Cloudflare R2 altyapısında şifreli olarak saklanır. Veritabanı MongoDB Atlas üzerinde çalışır ve güvenlik standartlarına uygun yapılandırılmıştır.\n\nGüvenlik olayı tespiti halinde kayıtlı e-posta adresinize 72 saat içinde bildirim gönderilir.\n\nCloudflare R2 ve MongoDB Atlas altyapısından kaynaklanan veri kayıplarında ZET'in sorumluluğu, bu hizmet sağlayıcıların kendi hizmet koşullarıyla sınırlıdır.`,
  },
  {
    id: 'ucuncu-taraf',
    title: '5. Üçüncü Taraf Hizmetler',
    content: `Platformumuzda aşağıdaki üçüncü taraf hizmetler kullanılmaktadır:\n• Cloudflare R2 — dosya depolama\n• MongoDB Atlas — veritabanı\n• Paddle — ödeme işlemleri\n• Anthropic (Claude) — AI özellikleri\n• ElevenLabs — ses özellikleri (isteğe bağlı)\n• Google Cloud Run — backend altyapısı\n• Firebase — web frontend dağıtımı\n\nBu hizmetlerin kendi gizlilik politikaları vardır.`,
  },
  {
    id: 'haklariniz',
    title: '6. Haklarınız',
    content: `KVKK ve GDPR kapsamında şu haklara sahipsiniz:\n• Erişim hakkı: Hangi verilerinizi işlediğimizi öğrenme\n• Düzeltme hakkı: Yanlış bilgilerin düzeltilmesini isteme\n• Silme hakkı: Hesabınızın ve verilerinizin silinmesini talep etme\n• Taşınabilirlik hakkı: Verilerinizi makine okunabilir formatta indirme\n• İtiraz hakkı: Belirli veri işleme faaliyetlerine itiraz etme\n\nBu haklarınızı kullanmak için ${EMAIL} adresine yazabilirsiniz.`,
  },
  {
    id: 'cerezler',
    title: '7. Çerezler',
    content: `Oturum yönetimi ve temel işlevsellik için zorunlu çerezler kullanılır. Analitik çerezler için onayınız alınır. Çerez politikamız hakkında daha fazla bilgi için Çerez Politikamızı inceleyebilirsiniz.`,
  },
  {
    id: 'degisiklikler',
    title: '8. Politika Değişiklikleri',
    content: `Bu politikayı güncelleyebiliriz. Önemli değişiklikler e-posta yoluyla bildirilir ve yürürlük tarihi bu sayfada belirtilir.`,
  },
  {
    id: 'iletisim',
    title: '9. İletişim',
    content: `Gizlilik konusundaki sorularınız için:\nE-posta: ${EMAIL}\nAdres: İstanbul, Türkiye`,
  },
];

export default function Privacy() {
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
          <h1>Gizlilik Politikası</h1>
          <p className="last-updated">Son güncelleme: {LAST_UPDATED}</p>
          {SECTIONS.map(s => (
            <div key={s.id} id={s.id}>
              <h2>{s.title}</h2>
              {s.content.split('\n').filter(l => !l.startsWith('•')).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              {s.content.includes('•') && (
                <ul>
                  {s.content.split('\n').filter(l => l.startsWith('•')).map((l, i) => (
                    <li key={i}>{l.replace('• ', '')}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
