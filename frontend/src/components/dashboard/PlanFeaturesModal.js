import React, { useState } from 'react';

const PLAN_META = {
  plus:             { name: 'Plus',             color: '#3b82f6', glow: 'rgba(59,130,246,0.25)'  },
  pro:              { name: 'Pro',              color: '#8b5cf6', glow: 'rgba(139,92,246,0.25)'  },
  creative_station: { name: 'Creative Station', color: '#f59e0b', glow: 'rgba(245,158,11,0.25)'  },
};

const SLIDES = {
  plus: [
    { icon: 'credit',   num: '250',  unit: 'kredi / gün',       title: 'Günlük 250 Kredi',            desc: 'Her gece UTC 00:00\'da 250 krediniz otomatik yenilenir. Zeta, Judge, görsel ve belge düzenlemede kullanırsınız.', detail: 'Free plan 80 kr/gün → Plus ile 3× daha fazla güç' },
    { icon: 'token',    num: '480K', unit: 'token / gün',       title: 'Zeta + Judge Token Havuzu',   desc: 'Zeta ile belge yazın, Judge ile analiz ettirin — ikisi de aynı 480K token havuzundan beslenir.', detail: '≈ 360K kelime — bir roman çevirisi' },
    { icon: 'tools',    title: 'Tüm Editör Araçları Açık',      desc: 'Katmanlar, gradyan renk seçici, özel şablonlar, yazı tipleri, imza, filigran, QR kod — hiçbiri kilitli değil.', highlight: ['Katmanlar', 'Gradyanlar', 'Şablonlar', 'İmza', 'Filigran', 'QR Kod'] },
    { icon: 'notebook', num: '10',   unit: 'defter',            title: '10 Defter ile Organize Ol',   desc: 'Her proje, ders veya konu için ayrı defter. Belgelerinizi kategorize edin, şifreyle kilitleyin.', detail: 'Free plan 1 defter → Plus ile 10×' },
    { icon: 'fast',     num: '5',    unit: 'fast select slotu', title: '5 Fast Select Slotu',         desc: 'Sık kullandığınız araçları Fast Select\'e kaydedin — tek tıkla erişin.', detail: 'Çalışma akışınızı özelleştirin' },
    { icon: 'judge',    title: 'Judge Aziz Modeli',             desc: 'En güçlü Judge modeliyle iş planlarınızı, projelerinizi, stratejilerinizi derinlemesine analiz ettirin.', detail: 'Yalnızca Plus ve üzeri planlarda' },
    { icon: 'drive',    num: '20',   unit: 'GB Prime Drive',    title: '20GB Bulut Depolama',         desc: 'Belgeleriniz ve dosyalarınız Prime Drive\'da güvende. Her cihazdan erişin, otomatik yedekleyin.', detail: 'Google Drive / iCloud senkronizasyonu' },
    { icon: 'chest',    num: '%40',  unit: 'şans / gün',        title: 'Günlük Sandık Şansı',         desc: 'Her gün %40 ihtimalle sandık kazanırsınız. Aylık maksimum 10 sandık hakkı.', detail: 'Sandıklarda: XP, ZP, kredi ve görsel temalar' },
    { icon: 'zp',       num: '+10',  unit: 'ZP / 100 ZP',      title: 'ZP Kazanç Bonusu',            desc: 'Görevlerden kazandığınız her 100 ZP için ekstra 10 ZP bonus gelir.', detail: '1000 ZP görev → 1100 ZP kazanırsınız' },
  ],
  pro: [
    { icon: 'credit',   num: '500',  unit: 'kredi / gün',       title: '500 Günlük Kredi',            desc: 'Her sabah 500 krediniz hazır. Görsel üretimi (20 kr), belge düzenleme ve AI yazımında özgürce kullanın.', detail: 'Plus\'ın 2×\'i' },
    { icon: 'token',    num: '1.3M', unit: 'token / gün',       title: 'Neredeyse Sınırsız Token',    desc: '1.300.000 günlük token ile Zeta ve Judge\'u saatlerce kullanabilirsiniz.', detail: '≈ 1M kelime → 3 roman, 200 rapor veya binlerce prompt' },
    { icon: 'image',    title: 'Nano Banana Pro Görsel',        desc: 'En yüksek kaliteli AI görsel modeliyle ultra-detaylı görseller üretin. Sinema kalitesinde çıktılar.', highlight: ['Sinema formatları (2.55:1)', 'Ultra detay modu', '16:9 · 9:16 · 1:1', 'Poster boyutları'] },
    { icon: 'fast',     num: '8',    unit: 'fast select slotu', title: '8 Fast Select Slotu',         desc: 'Araç çubuğunuzu tam istediğiniz gibi kurun. 8 slot — iş akışınız sizin şablonunuz.', detail: 'Plus\'ın 1.6×\'i' },
    { icon: 'drive',    num: '50',   unit: 'GB Prime Drive',    title: '50GB Bulut Depolama',         desc: 'Yüksek çözünürlüklü görseller, videolar ve büyük belgeler dahil her şeyi saklayın.', detail: '≈ 25.000 AI görsel veya 50 saatlik video' },
    { icon: 'clean',    title: 'Filigransız Auto-Write',        desc: 'AI ile otomatik oluşturulan belgeler tamamen temiz çıkar — logo, filigran, "AI tarafından üretildi" notu yok.', detail: 'Müşterilere sunacağınız belgeler profesyonel görünür' },
    { icon: 'chest',    num: '%60',  unit: 'şans / gün',        title: 'Yüksek Sandık Şansı',         desc: 'Her gün %60 olasılıkla sandık kazanırsınız. Aylık 20 sandık hakkı.', detail: 'Plus\'ın 2× şans ve sandık hakkı' },
    { icon: 'support',  title: 'Öncelikli Destek',              desc: 'Sorunlarınız kuyruğun başına alınır. Hata bildirimi, özellik isteği, teknik destek — hepsi öncelikli.', detail: 'support@zetstudiointl.com — öncelikli yanıt' },
    { icon: 'zp',       num: '+20',  unit: 'ZP / 100 ZP',      title: 'Daha Güçlü ZP Bonusu',        desc: 'Görevlerden kazandığınız her 100 ZP için 20 ZP bonus. Plus\'ın iki katı kazanç hızı.', detail: '1000 ZP görev → 1200 ZP' },
  ],
  creative_station: [
    { icon: 'credit',     num: '4000', unit: 'ortak kredi / gün',   title: '4000 Günlük Ortak Kredi',     desc: 'Zeta, Judge, görsel üretimi, belge düzenleme — hepsi aynı devasa havuzdan. Kredi endişesi yok.', detail: 'Free plan 80 kr → CS ile 50×. Bir günde 200 görsel veya 400 belge' },
    { icon: 'token',      num: '4.8M', unit: 'token / gün',         title: '4.8 Milyon Token',            desc: 'Günlük 4.8 milyon token ile Zeta veya Judge\'u sabahtan akşama kadar kullanın. Token sınırı tarihe karışıyor.', detail: '≈ 3.6M kelime → 12 roman, 800 rapor' },
    { icon: 'storage',    num: '1',    unit: 'TB Prime Drive',       title: '1 Terabayt Depolama',         desc: 'Video projeler, yüksek çözünürlüklü görsel arşivler — hiçbir şeyi silmek zorunda kalmayın.', detail: '≈ 500K AI görsel, 250 saatlik 4K video' },
    { icon: 'guaranteed', num: '%100', unit: 'şans / gün',          title: 'Garantili Günlük Sandık',     desc: 'Her gün kesinlikle bir sandık kazanırsınız. %100 ihtimal, hiçbir gün sıfır dönmez.', detail: 'Aylık 30 sandık hakkı — yılda 360 sandık' },
    { icon: 'chest_cs',   num: '30',   unit: 'sandık / ay',         title: 'Aylık 30 Sandık',             desc: 'CS sandıkları özel ödüller içerir: nadir görsel temalar, büyük ZP paketleri.', detail: 'Pro: aylık 20 → CS: aylık 30 (%50 daha fazla)' },
    { icon: 'support',    title: '7/24 Öncelikli Destek',           desc: 'Sorunlarınız kuyruğa bile girmez. Özel CS destek kanalı, en hızlı yanıt garantisi.', detail: 'Hata bildirimi, özellik isteği, stratejik danışma' },
    { icon: 'ai_edit',    title: 'Zeta Belge Düzenleme AI',         desc: 'Sadece konuşun, Zeta yapsın: "Bu tabloya iki sütun daha ekle", "Başlığı büyüt", "Sayfanın ortasına şekil koy."', detail: 'Yalnızca Creative Station\'da' },
    { icon: 'image',      title: 'Nano Banana Pro — Tam Erişim',   desc: '4000 kredinizle günde yüzlerce Pro görsel üretebilirsiniz.', highlight: ['Sinema formatları', 'Ultra detay', 'Poster boyutları', 'Tüm en-boy oranları'] },
    { icon: 'clean',      title: 'Filigransız Her Şey',             desc: 'AI ile üretilen tüm içerik, belgeler ve görseller tamamen temiz. "AI ile üretildi" izi kalmaz.', detail: 'Müşterilere, yayınlara, sunumlara doğrudan kullanılabilir' },
    { icon: 'zp',         num: '+30',  unit: 'ZP / 100 ZP',        title: 'En Güçlü ZP Bonusu',          desc: 'Her 100 ZP için 30 ZP bonus — tüm planlar içinde en yüksek çarpan.', detail: '1000 ZP görev → 1300 ZP' },
    { icon: 'notebook',   title: 'Pro\'nun Her Şeyi Dahil',        desc: '10 defter, 8 Fast Select, tüm editör araçları, Judge Aziz, öncelikli destek — Pro\'daki her şey CS\'de de var.', detail: 'CS = Pro + daha fazla + 1TB + garantili sandık + AI düzenleme' },
    { icon: 'cs_exclusive', title: 'Creative Station Farkı',        desc: 'CS sadece bir plan değil — günlük üretkenliğini profesyonel düzeyde yönetenler için tasarlandı.', detail: 'Token, kredi, depolama, sandık, destek — tüm metriklerde en yüksek' },
  ],
};

const Visual = ({ icon, color }) => {
  const s = { width: 88, height: 88 };
  switch (icon) {
    case 'credit': return (
      <svg viewBox="0 0 120 120" style={s}><circle cx="60" cy="60" r="50" fill={color+'20'} stroke={color} strokeWidth="2"/><circle cx="60" cy="60" r="38" fill={color+'15'}/><path d="M42 52 L78 52 L78 72 Q78 76 74 76 L46 76 Q42 76 42 72 Z" fill={color+'40'} stroke={color} strokeWidth="1.5"/><rect x="42" y="58" width="36" height="5" fill={color} opacity="0.7"/><circle cx="70" cy="68" r="4" fill={color} opacity="0.5"/><circle cx="63" cy="68" r="4" fill={color} opacity="0.3"/></svg>
    );
    case 'token': return (
      <svg viewBox="0 0 120 120" style={s}><circle cx="60" cy="60" r="50" fill={color+'15'}/>{[0,1,2,3,4,5].map(i=>{const a=(i*60-90)*Math.PI/180,x=60+40*Math.cos(a),y=60+40*Math.sin(a);return<circle key={i} cx={x} cy={y} r="8" fill={color} opacity={0.3+i*0.1}/>;})} <circle cx="60" cy="60" r="16" fill={color+'50'} stroke={color} strokeWidth="2"/><text x="60" y="65" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">AI</text></svg>
    );
    case 'tools': return (
      <svg viewBox="0 0 120 120" style={s}>{[[20,20],[65,20],[20,65],[65,65]].map(([x,y],i)=><g key={i}><rect x={x} y={y} width="36" height="36" rx="6" fill={color+'25'} stroke={color} strokeWidth="1.5" opacity={0.6+i*0.1}/></g>)}<circle cx="60" cy="60" r="8" fill={color} opacity="0.8"/></svg>
    );
    case 'notebook': return (
      <svg viewBox="0 0 120 120" style={s}><rect x="36" y="20" width="64" height="80" rx="5" fill={color+'25'} stroke={color} strokeWidth="2"/><line x1="50" y1="42" x2="88" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="50" y1="54" x2="88" y2="54" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/><line x1="50" y1="66" x2="75" y2="66" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/><rect x="20" y="30" width="8" height="60" rx="2" fill={color} opacity="0.4"/></svg>
    );
    case 'fast': return (
      <svg viewBox="0 0 120 120" style={s}><circle cx="60" cy="60" r="50" fill={color+'15'}/>{[0,1,2,3,4,5,6,7].map(i=>{const a=(i*45-90)*Math.PI/180,x=60+34*Math.cos(a),y=60+34*Math.sin(a);return<rect key={i} x={x-9} y={y-7} width="18" height="14" rx="3" fill={color} opacity={0.2+i*0.07} stroke={color} strokeWidth="1"/>;})} <path d="M52 44 L76 60 L52 76 Z" fill={color} opacity="0.8"/></svg>
    );
    case 'judge': return (
      <svg viewBox="0 0 120 120" style={s}><circle cx="60" cy="60" r="50" fill={color+'15'}/><line x1="60" y1="22" x2="60" y2="98" stroke={color} strokeWidth="3" strokeLinecap="round"/><line x1="30" y1="45" x2="90" y2="45" stroke={color} strokeWidth="2" strokeLinecap="round"/><ellipse cx="32" cy="58" rx="16" ry="8" fill={color+'35'} stroke={color} strokeWidth="1.5"/><ellipse cx="88" cy="50" rx="16" ry="8" fill={color+'20'} stroke={color} strokeWidth="1.5" opacity="0.7"/></svg>
    );
    case 'drive': return (
      <svg viewBox="0 0 120 120" style={s}><ellipse cx="60" cy="68" rx="40" ry="24" fill={color+'25'} stroke={color} strokeWidth="2"/><ellipse cx="60" cy="54" rx="40" ry="24" fill={color+'30'} stroke={color} strokeWidth="2"/><ellipse cx="60" cy="40" rx="40" ry="24" fill={color+'35'} stroke={color} strokeWidth="2"/><line x1="20" y1="40" x2="20" y2="68" stroke={color} strokeWidth="2"/><line x1="100" y1="40" x2="100" y2="68" stroke={color} strokeWidth="2"/></svg>
    );
    case 'chest': return (
      <svg viewBox="0 0 120 120" style={s}><rect x="20" y="56" width="80" height="48" rx="8" fill={color+'25'} stroke={color} strokeWidth="2"/><rect x="20" y="40" width="80" height="24" rx="8" fill={color+'35'} stroke={color} strokeWidth="2"/><rect x="46" y="58" width="28" height="16" rx="5" fill={color} opacity="0.7"/></svg>
    );
    case 'chest_cs': return (
      <svg viewBox="0 0 120 120" style={s}><rect x="18" y="54" width="84" height="52" rx="8" fill={color+'25'} stroke={color} strokeWidth="2"/><rect x="18" y="38" width="84" height="24" rx="8" fill={color+'40'} stroke={color} strokeWidth="2"/><rect x="44" y="56" width="32" height="18" rx="5" fill={color} opacity="0.8"/><circle cx="60" cy="17" r="16" fill={color+'30'} stroke={color} strokeWidth="2"/><text x="60" y="22" textAnchor="middle" fill={color} fontSize="10" fontWeight="800">30</text></svg>
    );
    case 'support': return (
      <svg viewBox="0 0 120 120" style={s}><circle cx="60" cy="50" r="32" fill={color+'20'} stroke={color} strokeWidth="2"/><path d="M46 42 C46 30 74 30 74 46 C74 58 60 58 60 70" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"/><circle cx="60" cy="77" r="4" fill={color} opacity="0.9"/></svg>
    );
    case 'image': return (
      <svg viewBox="0 0 120 120" style={s}><rect x="14" y="24" width="92" height="72" rx="8" fill={color+'20'} stroke={color} strokeWidth="2"/><circle cx="36" cy="44" r="10" fill={color} opacity="0.5"/><path d="M14 72 L38 50 L58 70 L74 54 L106 80 L106 88 Q106 96 98 96 L22 96 Q14 96 14 88 Z" fill={color+'40'}/><path d="M88 30 L88 18 M82 24 L94 24" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/></svg>
    );
    case 'clean': return (
      <svg viewBox="0 0 120 120" style={s}><rect x="22" y="18" width="76" height="90" rx="6" fill={color+'15'} stroke={color} strokeWidth="2"/><line x1="36" y1="40" x2="84" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7"/><line x1="36" y1="52" x2="84" y2="52" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/><circle cx="86" cy="88" r="20" fill="#0f172a" stroke={color} strokeWidth="2"/><path d="M76 88 L82 94 L96 80" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
    case 'zp': return (
      <svg viewBox="0 0 120 120" style={s}><circle cx="60" cy="60" r="50" fill={color+'15'}/><circle cx="60" cy="60" r="38" fill={color+'20'} stroke={color} strokeWidth="2"/><text x="60" y="52" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" opacity="0.6">100 ZP</text><path d="M50 58 L60 70 L70 58" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><text x="60" y="82" textAnchor="middle" fill={color} fontSize="14" fontWeight="800">+BONUS</text></svg>
    );
    case 'storage': return (
      <svg viewBox="0 0 120 120" style={s}>{[0,1,2].map(i=><rect key={i} x="22" y={28+i*24} width="76" height="18" rx="5" fill={color+(i===2?'45':'25')} stroke={color} strokeWidth="1.5" opacity={0.6+i*0.2}/>)}<text x="44" y="41" fill={color} fontSize="9" fontWeight="700" opacity="0.8">1 TB</text></svg>
    );
    case 'guaranteed': return (
      <svg viewBox="0 0 120 120" style={s}><rect x="20" y="56" width="80" height="50" rx="8" fill={color+'25'} stroke={color} strokeWidth="2"/><rect x="20" y="40" width="80" height="24" rx="8" fill={color+'35'} stroke={color} strokeWidth="2"/><rect x="46" y="58" width="28" height="16" rx="5" fill={color} opacity="0.8"/><circle cx="60" cy="28" r="16" fill={color+'30'} stroke={color} strokeWidth="2"/><path d="M52 28 L57 33 L68 22" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
    case 'ai_edit': return (
      <svg viewBox="0 0 120 120" style={s}><rect x="18" y="20" width="84" height="70" rx="6" fill={color+'15'} stroke={color} strokeWidth="2"/><line x1="32" y1="42" x2="88" y2="42" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/><line x1="32" y1="54" x2="88" y2="54" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/><circle cx="88" cy="88" r="20" fill={color+'35'} stroke={color} strokeWidth="2"/><text x="88" y="84" textAnchor="middle" fill={color} fontSize="8" fontWeight="700">ZETA</text><text x="88" y="94" textAnchor="middle" fill={color} fontSize="7" opacity="0.7">Düzenle</text></svg>
    );
    case 'cs_exclusive': return (
      <svg viewBox="0 0 120 120" style={s}><circle cx="60" cy="60" r="50" fill={color+'15'}/>{[0,1,2,3,4].map(i=>{const a=(i*72-90)*Math.PI/180,x=60+38*Math.cos(a),y=60+38*Math.sin(a);return<polygon key={i} points={`${x},${y-6} ${x+5},${y+4} ${x-5},${y+4}`} fill={color} opacity={0.4+i*0.1}/>;})} <circle cx="60" cy="60" r="22" fill={color+'35'} stroke={color} strokeWidth="2"/><text x="60" y="56" textAnchor="middle" fill={color} fontSize="7" fontWeight="700">CREATIVE</text><text x="60" y="67" textAnchor="middle" fill={color} fontSize="7" fontWeight="700">STATION</text></svg>
    );
    default: return (
      <svg viewBox="0 0 120 120" style={s}><circle cx="60" cy="60" r="50" fill={color+'20'} stroke={color} strokeWidth="2"/><circle cx="60" cy="60" r="24" fill={color} opacity="0.5"/></svg>
    );
  }
};

const PlanFeaturesModal = ({ plan, onClose }) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const meta = PLAN_META[plan] || { name: plan, color: '#4ca8ad', glow: 'rgba(76,168,173,0.25)' };
  const slides = SLIDES[plan] || [];
  const total = slides.length;
  const slide = slides[slideIdx];

  if (!slide) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 520,
          background: `radial-gradient(ellipse at 30% 0%, ${meta.glow} 0%, transparent 60%), #0d1230`,
          border: `1px solid ${meta.color}30`,
          borderRadius: 24,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
            <span style={{ color: meta.color, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>
              {meta.name.toUpperCase()} — AVANTAJLARIM
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ margin: '10px 20px 0', height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
          <div style={{ height: '100%', borderRadius: 99, background: meta.color, width: `${((slideIdx + 1) / total) * 100}%`, transition: 'width 0.35s ease' }} />
        </div>

        {/* Slide content */}
        <div style={{ padding: '24px 28px', textAlign: 'center', minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Visual or big number */}
          <div style={{ marginBottom: 20, filter: `drop-shadow(0 0 18px ${meta.color}50)` }}>
            {slide.num ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 60, fontWeight: 900, color: meta.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{slide.num}</div>
                <div style={{ fontSize: 13, color: meta.color + 'aa', fontWeight: 600, marginTop: 2 }}>{slide.unit}</div>
              </div>
            ) : (
              <Visual icon={slide.icon} color={meta.color} />
            )}
          </div>

          <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.3 }}>{slide.title}</h3>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.65, margin: '0 0 12px' }}>{slide.desc}</p>

          {slide.highlight && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
              {slide.highlight.map((h, i) => (
                <span key={i} style={{ background: meta.color + '20', border: `1px solid ${meta.color}40`, color: meta.color, fontSize: 11, fontWeight: 600, borderRadius: 99, padding: '3px 12px' }}>{h}</span>
              ))}
            </div>
          )}

          {slide.detail && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.6 }}>
              {slide.detail}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 20px', gap: 12 }}>
          <button
            onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
            disabled={slideIdx === 0}
            style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', cursor: slideIdx === 0 ? 'default' : 'pointer', fontSize: 18, opacity: slideIdx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >←</button>

          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setSlideIdx(i)} style={{ width: i === slideIdx ? 18 : 5, height: 5, borderRadius: 99, border: 'none', cursor: 'pointer', background: i === slideIdx ? meta.color : 'rgba(255,255,255,0.18)', transition: 'all 0.25s', padding: 0 }} />
            ))}
          </div>

          {slideIdx < total - 1 ? (
            <button
              onClick={() => setSlideIdx(i => i + 1)}
              style={{ height: 40, padding: '0 20px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >İleri →</button>
          ) : (
            <button
              onClick={onClose}
              style={{ height: 40, padding: '0 20px', borderRadius: 10, border: 'none', background: meta.color, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: `0 0 16px ${meta.color}50` }}
            >Kapat</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanFeaturesModal;
