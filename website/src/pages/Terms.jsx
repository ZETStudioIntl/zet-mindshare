import React from 'react';

const LAST_UPDATED = '1 Ağustos 2026';
const EMAIL = 'help@zetstudiointl.com';

const SECTIONS = [
  {
    id: 'kabul',
    title: '1. Şartların Kabulü',
    content: `ZET Studio International tarafından sunulan hizmetleri kullanarak bu Kullanım Koşulları\'nı kabul etmiş olursunuz. Koşulları kabul etmiyorsanız, hizmetlerimizi kullanmayınız.\n\nBu koşullar; web uygulaması, mobil uygulamalar ve API dahil olmak üzere ZET platformunun tüm bileşenleri için geçerlidir.`,
  },
  {
    id: 'hesap',
    title: '2. Hesap ve Güvenlik',
    content: `Hesap oluşturma sürecinde doğru ve güncel bilgi vermelisiniz. Hesap güvenliğinden siz sorumlusunuzdur; şifrenizi kimseyle paylaşmayınız.\n\nHesabınızda yetkisiz bir işlem fark ettiğinizde derhal ${EMAIL} adresine bildirmeniz gerekmektedir. Bildirim yapmamanızdan kaynaklanan zararlardan ZET sorumlu tutulamaz.`,
  },
  {
    id: 'kullanim',
    title: '3. Kabul Edilebilir Kullanım',
    content: `Platformumuzu yalnızca yasal amaçlar için kullanabilirsiniz. Aşağıdaki eylemler kesinlikle yasaktır:\n• Başkalarının telif hakkı veya gizliliğini ihlal eden içerik yüklemek\n• Zararlı yazılım, virüs veya kötü amaçlı kod yaymak\n• Otomatik araçlarla sunucularımıza aşırı yük bindirmek\n• Hizmetimizi yasadışı faaliyetler için kullanmak\n• Başkalarını taciz etmek, tehdit etmek veya zarar vermek`,
  },
  {
    id: 'fikri-mulkiyet',
    title: '4. Fikri Mülkiyet',
    content: `Platforma yüklediğiniz içeriklerin (belgeler, görseller, notlar) fikri mülkiyet hakları size aittir. ZET\'e yalnızca hizmeti sunmak için gerekli sınırlı lisansı vermiş olursunuz.\n\nZET markası, logoları, yazılımı ve tasarımı ZET Studio International\'a aittir. İzinsiz kullanım yasaktır.`,
  },
  {
    id: 'abonelik',
    title: '5. Abonelik ve Ödeme',
    content: `Ücretli planlar aylık veya yıllık olarak faturalandırılır. Aboneliğinizi dönem sonuna kadar istediğiniz zaman iptal edebilirsiniz; iptal ettiğinizde bir sonraki dönemde ücret alınmaz.\n\nFiyat değişiklikleri en az 30 gün öncesinden bildirilir. Ödemeler Paddle altyapısı üzerinden işlenir. Kredi kartı ve geçerli ödeme yöntemleri kabul edilir.`,
  },
  {
    id: 'sorumluluk',
    title: '6. Sorumluluk Sınırlaması',
    content: `ZET hizmetleri "olduğu gibi" sunulmaktadır. Veri kaybı, hizmet kesintisi veya üçüncü taraf uygulamalarından kaynaklanan zararlar için ZET\'in sorumluluğu, son 12 ay içinde ödediğiniz toplam abonelik tutarıyla sınırlıdır.\n\nÖngörülemeyen teknik aksaklıklar veya mücbir sebep hallerinden doğan zararlardan sorumlu değiliz.`,
  },
  {
    id: 'fesih',
    title: '7. Hesap Feshi',
    content: `Bu Kullanım Koşulları\'nı ihlal etmeniz halinde hesabınız bildirim yapılmaksızın askıya alınabilir veya silinebilir. İhlal etmediğinizi düşünüyorsanız ${EMAIL} adresine itiraz hakkınız bulunmaktadır.\n\nSiz de istediğiniz zaman hesabınızı silebilirsiniz. Silme işlemi sonrası 30 gün içinde verilerinizi dışa aktarabilirsiniz; bu süreden sonra veriler kalıcı olarak silinir.`,
  },
  {
    id: 'degisiklikler',
    title: '8. Koşullardaki Değişiklikler',
    content: `Bu koşulları zaman zaman güncelleyebiliriz. Önemli değişiklikler e-posta yoluyla bildirilir. Değişiklik sonrası hizmeti kullanmaya devam etmeniz yeni koşulları kabul ettiğiniz anlamına gelir.`,
  },
  {
    id: 'iletisim',
    title: '9. İletişim',
    content: `Bu koşullarla ilgili sorularınız için ${EMAIL} adresine ulaşabilirsiniz.\n\nAdres: İstanbul, Türkiye`,
  },
];

export default function Terms() {
  return (
    <div style={{ paddingTop: 'var(--header-h)' }}>
      <div className="legal-wrap">
        {/* TOC */}
        <aside className="legal-toc">
          <h4>İçindekiler</h4>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}>{s.title}</a>
          ))}
        </aside>

        {/* Content */}
        <div className="legal-content">
          <h1>Kullanım Koşulları</h1>
          <p className="last-updated">Son güncelleme: {LAST_UPDATED}</p>
          {SECTIONS.map(s => (
            <div key={s.id} id={s.id}>
              <h2>{s.title}</h2>
              {s.content.split('\n').map((line, i) => (
                line.startsWith('•')
                  ? null
                  : <p key={i}>{line}</p>
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
