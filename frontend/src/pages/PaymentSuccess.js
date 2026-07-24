import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── Per-plan slide definitions ───────────────────────────────────────────────

const PLAN_META = {
  plus: { name: 'Plus', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)', emoji: '⚡', price: '$9.99/ay' },
  pro: { name: 'Pro', color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', emoji: '🚀', price: '$19.99/ay' },
  creative_station: { name: 'Creative Station', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', emoji: '✦', price: '$49/ay' },
};

const SLIDES = {
  plus: [
    {
      icon: 'credit',
      num: '250',
      unit: 'kredi / gün',
      title: 'Günlük Krediniz Yenilendi',
      desc: 'Her gece UTC 00:00\'da 250 krediniz otomatik yenilenir. Zeta ile görsel, analiz ve yazma işlemlerinde kullanırsınız.',
      detail: 'Free plan 80 kredi/gün → Plus ile 3× daha fazla güç',
    },
    {
      icon: 'token',
      num: '480K',
      unit: 'token / gün',
      title: 'Zeta + Judge Token Havuzu',
      desc: 'Zeta ile belge yazın, Judge ile analiz ettirin — her ikisi de aynı 480K token havuzundan beslenir.',
      detail: '480.000 token ≈ yaklaşık 360.000 kelime — bir roman çevirisi yapar',
    },
    {
      icon: 'tools',
      title: 'Tüm Editör Araçları Açık',
      desc: 'Katmanlar, gradyan renk seçici, özel şablonlar, yazı tipleri, imza paneli, filigran, QR kod — hiçbiri kilitli değil.',
      highlight: ['Katmanlar', 'Gradyanlar', 'Şablonlar', 'İmza', 'Filigran', 'QR Kod'],
    },
    {
      icon: 'notebook',
      num: '10',
      unit: 'defter',
      title: '10 Defter ile Organize Ol',
      desc: 'Her proje, ders veya konu için ayrı defter açın. Belgelerinizi kategorize edin, şifreyle kilitleyin.',
      detail: 'Free plan 1 defter → Plus ile 10 defter',
    },
    {
      icon: 'fast',
      num: '5',
      unit: 'fast select',
      title: '5 Fast Select Slotu',
      desc: 'Sık kullandığınız araçları veya şablonları Fast Select\'e kaydedin — tek tıkla erişin.',
      detail: 'Zaman kazanmak için çalışma akışınızı özelleştirin',
    },
    {
      icon: 'judge',
      title: 'Judge Aziz Modeli Açıldı',
      desc: 'En güçlü Judge modeliyle iş planlarınızı, projelerinizi ve stratejilerinizi derinlemesine analiz ettirin.',
      detail: 'Aziz modeli yalnızca Plus ve üzeri planlarda kullanılabilir',
    },
    {
      icon: 'drive',
      num: '20',
      unit: 'GB Prime Drive',
      title: 'Bulut Depolama Aktif',
      desc: 'Belgeleriniz ve dosyalarınız 20GB Prime Drive\'da güvende. Her cihazdan erişin, otomatik yedekleyin.',
      detail: 'Google Drive veya iCloud bağlantısıyla senkronize',
    },
    {
      icon: 'chest',
      num: '%40',
      unit: 'şans / gün',
      title: 'Günlük Sandık Şansı',
      desc: 'Her gün %40 ihtimalle bir sandık kazanırsınız. Aylık maksimum 10 sandık hakkınız var.',
      detail: 'Sandıklarda: XP, ZP, kredi ve özel görsel temalar',
    },
    {
      icon: 'zp',
      num: '+10',
      unit: 'ZP / 100 ZP',
      title: 'ZP Kazanç Bonusu',
      desc: 'Görevlerden kazandığınız her 100 ZP için ekstra 10 ZP bonus gelir. Zamanla büyük fark yaratır.',
      detail: '1000 ZP görev → 1100 ZP kazanırsınız (Plus bonusu ile)',
    },
    {
      icon: 'star',
      title: 'Plus\'ın Tamamı Bu Kadar',
      desc: 'Artık daha fazla krediniz, daha güçlü AI erişiminiz ve açık tüm editör araçlarınız var. Üretmeye başlayın.',
      isLast: true,
    },
  ],

  pro: [
    {
      icon: 'credit',
      num: '500',
      unit: 'kredi / gün',
      title: '500 Günlük Kredi',
      desc: 'Her sabah 500 krediniz hazır. Görsel üretimi (20 kr), belge düzenleme ve AI yazımında özgürce kullanın.',
      detail: 'Plus\'ın 2×\'i — yaratıcılığınızı kredi sınırlaması yavaşlatmaz',
    },
    {
      icon: 'token',
      num: '1.3M',
      unit: 'token / gün',
      title: 'Neredeyse Sınırsız Token',
      desc: '1.300.000 günlük token — Zeta ile saatlerce konuşabilir, Judge ile onlarca belge analiz ettirebilirsiniz.',
      detail: '1.3M token ≈ yaklaşık 1 milyon kelime → 3 roman, 200 rapor veya binlerce prompt',
    },
    {
      icon: 'image',
      title: 'Nano Banana Pro Görsel Üretimi',
      desc: 'En yüksek kaliteli AI görsel modeliyle ultra-detaylı görseller üretin. Sinema kalitesinde, gerçekçi çıktılar.',
      highlight: ['Sinema formatları (2.55:1, 2.39:1)', 'Ultra detay modu', '16:9 · 9:16 · 1:1', 'Poster boyutu (2:1, 1.85:1)'],
    },
    {
      icon: 'fast',
      num: '8',
      unit: 'fast select slotu',
      title: '8 Fast Select Slotu',
      desc: 'Araç çubuğunuzu tam olarak istedğiniz gibi kurun. 8 slot — iş akışınız sizin şablonunuz.',
      detail: 'Plus\'ın 1.6×\'i — daha hızlı, daha kişisel',
    },
    {
      icon: 'drive',
      num: '50',
      unit: 'GB Prime Drive',
      title: '50GB Bulut Depolama',
      desc: 'Yüksek çözünürlüklü görseller, videolar ve büyük belgeler dahil her şeyi bulutta saklayın.',
      detail: '50GB ≈ yaklaşık 25.000 yüksek kaliteli AI görsel veya 50 saatlik video',
    },
    {
      icon: 'clean',
      title: 'Filigransız Auto-Write',
      desc: 'AI ile otomatik oluşturduğunuz tüm belgeler tamamen temiz çıkar — logo, filigran, "AI tarafından üretildi" notu yok.',
      detail: 'Müşterilerinize sunacağınız belgeler profesyonel görünür',
    },
    {
      icon: 'chest',
      num: '%60',
      unit: 'şans / gün',
      title: 'Yüksek Sandık Şansı',
      desc: 'Her gün %60 olasılıkla sandık kazanırsınız. Aylık 20 sandık hakkı ile ödüller birikir.',
      detail: 'Plus\'ın 2×\'i şans, 2×\'i sandık hakkı',
    },
    {
      icon: 'support',
      title: 'Öncelikli Destek',
      desc: 'Sorunlarınız kuyruğun başına alınır. Hata bildirimi, özellik isteği veya teknik destek — her biri öncelikli.',
      detail: 'E-posta: support@zetstudiointl.com — öncelikli yanıt',
    },
    {
      icon: 'zp',
      num: '+20',
      unit: 'ZP / 100 ZP',
      title: 'Daha Güçlü ZP Bonusu',
      desc: 'Görevlerden kazandığınız her 100 ZP için 20 ZP bonus alırsınız. Plus\'ın iki katı kazanç hızı.',
      detail: '1000 ZP görev → 1200 ZP (Pro bonusu ile)',
    },
    {
      icon: 'notebook',
      title: 'Tüm Editör Araçları + Kısıtlama Yok',
      desc: 'Plus\'taki her şeyin üzerine: Nano Banana Pro, filigransız exportlar, iki kat daha yüksek token ve sandık şansı.',
      detail: '10 defter, tüm araçlar, Judge Aziz — hepsi dahil',
    },
    {
      icon: 'star',
      title: 'Pro\'nun Tamamı Bu Kadar',
      desc: 'Görselden belgeye, analizden arşive — üretken bir profesyonelin ihtiyacı olan her şey Pro\'da var.',
      isLast: true,
    },
  ],

  creative_station: [
    {
      icon: 'credit',
      num: '4000',
      unit: 'ortak kredi / gün',
      title: '4000 Günlük Kredi — Gerçek Güç',
      desc: '"Ortak kredi" demek: Zeta, Judge, görsel üretimi, belge düzenleme — hepsi aynı devasa havuzdan besleniyor.',
      detail: 'Free plan 80 kr → CS ile 50× daha fazla. Bir günde 200 görsel veya 400 belge düzenleyebilirsiniz.',
    },
    {
      icon: 'token',
      num: '4.8M',
      unit: 'token / gün',
      title: '4.8 Milyon Token — Sınır Yok',
      desc: 'Günlük 4.8 milyon token ile Zeta veya Judge\'u sabahtan akşama kadar kullanabilirsiniz. Token endişesi tarihe karışıyor.',
      detail: '4.8M token ≈ 3.6 milyon kelime → 12 roman, 800 rapor veya binlerce kompleks analiz',
    },
    {
      icon: 'storage',
      num: '1',
      unit: 'TB Prime Drive',
      title: '1 Terabayt Bulut Depolama',
      desc: 'Video projeler, yüksek çözünürlüklü görsel arşivler, tüm belgeleriniz — hiçbir şeyi silmek zorunda kalmayın.',
      detail: '1 TB = 1024 GB ≈ 500.000 AI görsel, 250 saatlik 4K video veya milyonlarca belge',
    },
    {
      icon: 'guaranteed',
      num: '%100',
      unit: 'şans / gün',
      title: 'Garantili Günlük Sandık',
      desc: 'Her gün kesinlikle bir sandık kazanırsınız. %100 ihtimal, hiçbir gün sıfır dönmez.',
      detail: 'Aylık en fazla 30 sandık hakkı — yılda 360 sandık',
    },
    {
      icon: 'chest_cs',
      num: '30',
      unit: 'sandık / ay',
      title: 'Aylık 30 Sandık Hakkı',
      desc: 'Tüm planlarda en yüksek sandık sınırı. CS sandıkları özel ödüller içerir: nadir görsel temalar, büyük ZP paketleri.',
      detail: 'Pro: aylık 20 sandık → CS: aylık 30 sandık (%50 daha fazla)',
    },
    {
      icon: 'support',
      title: '7/24 Öncelikli Destek',
      desc: 'Sorunlarınız kuyruğa bile girmez. Özel CS destek kanalı, en hızlı yanıt garantisi.',
      detail: 'Hata bildirimi, özellik isteği, stratejik danışma — hepsi önce siz',
    },
    {
      icon: 'ai_edit',
      title: 'Zeta Belge Düzenleme AI',
      desc: 'Sadece konuşun, Zeta yapsın: "Bu tabloya iki sütun daha ekle", "Başlığı büyüt", "Sayfanın ortasına bir şekil koy."',
      detail: 'Editörü manuel kullanmak yerine konuşarak tasarlayın — yalnızca CS planında',
    },
    {
      icon: 'image',
      title: 'Nano Banana Pro — Tam Erişim',
      desc: 'En yüksek kaliteli görsel üretimi CS\'de de tam açık. 4000 kredinizle günde yüzlerce Pro görsel üretebilirsiniz.',
      highlight: ['Sinema formatları', 'Ultra detay', 'Poster boyutları', 'Tüm en-boy oranları'],
    },
    {
      icon: 'clean',
      title: 'Filigransız Her Şey',
      desc: 'AI ile üretilen tüm içerik, belgeler ve görseller tamamen temiz. Hiçbir şeyde "AI ile üretildi" izi kalmaz.',
      detail: 'Müşterilere, yayınlara, sunumlara doğrudan kullanılabilir çıktılar',
    },
    {
      icon: 'zp',
      num: '+30',
      unit: 'ZP / 100 ZP',
      title: 'En Güçlü ZP Bonusu',
      desc: 'Görev tamamladığınızda her 100 ZP için 30 ZP bonus alırsınız. Tüm planlar içinde en yüksek çarpan.',
      detail: '1000 ZP görev → 1300 ZP (CS bonusu ile) — Pro\'nun 1.5×\'i',
    },
    {
      icon: 'notebook',
      title: 'Pro\'nun Her Şeyi Dahil',
      desc: '10 defter, 8 Fast Select, tüm editör araçları, Judge Aziz, öncelikli destek — Pro\'daki her şey CS\'de de var.',
      detail: 'CS = Pro + daha fazla kredi + daha fazla token + 1TB + garantili sandık + AI düzenleme',
    },
    {
      icon: 'cs_exclusive',
      title: 'Creative Station Farkı',
      desc: 'CS sadece bir plan değil — günlük üretkenliğini profesyonel düzeyde yönetenler için tasarlandı. Her özellik en üst seviyede.',
      detail: 'Token, kredi, depolama, sandık, destek — tüm metriklerde en yüksek değerler',
    },
    {
      icon: 'star',
      title: 'Creative Station\'ın Tamamı Bu Kadar',
      desc: 'Kreatiflerin, girişimcilerin ve üretkenlik takipçilerinin planı. Her gün yeni bir şey üretin — CS sizi durdurmaz.',
      isLast: true,
    },
  ],
};

// ─── SVG Visual components ────────────────────────────────────────────────────

const Visual = ({ icon, color }) => {
  const s = { width: 120, height: 120 };
  switch (icon) {
    case 'credit': return (
      <svg viewBox="0 0 120 120" style={s}>
        <circle cx="60" cy="60" r="50" fill={color + '20'} stroke={color} strokeWidth="2" />
        <circle cx="60" cy="60" r="38" fill={color + '15'} />
        <path d="M42 52 L78 52 L78 72 Q78 76 74 76 L46 76 Q42 76 42 72 Z" fill={color + '40'} stroke={color} strokeWidth="1.5" />
        <rect x="42" y="58" width="36" height="5" fill={color} opacity="0.7" />
        <circle cx="70" cy="68" r="4" fill={color} opacity="0.5" />
        <circle cx="63" cy="68" r="4" fill={color} opacity="0.3" />
      </svg>
    );
    case 'token': return (
      <svg viewBox="0 0 120 120" style={s}>
        <circle cx="60" cy="60" r="50" fill={color + '15'} />
        {[0,1,2,3,4,5].map(i => {
          const a = (i * 60 - 90) * Math.PI / 180;
          const x = 60 + 40 * Math.cos(a), y = 60 + 40 * Math.sin(a);
          return <circle key={i} cx={x} cy={y} r="8" fill={color} opacity={0.3 + i * 0.1} />;
        })}
        <circle cx="60" cy="60" r="16" fill={color + '50'} stroke={color} strokeWidth="2" />
        <text x="60" y="65" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">AI</text>
      </svg>
    );
    case 'tools': return (
      <svg viewBox="0 0 120 120" style={s}>
        {[[20,20,'Katman'],[65,20,'Gradyan'],[20,65,'Şablon'],[65,65,'İmza']].map(([x,y,lbl],i) => (
          <g key={i}>
            <rect x={x} y={y} width="36" height="36" rx="6" fill={color + '25'} stroke={color} strokeWidth="1.5" opacity={0.6 + i*0.1} />
            <text x={x+18} y={y+22} textAnchor="middle" fill={color} fontSize="7" fontWeight="600">{lbl}</text>
          </g>
        ))}
        <circle cx="60" cy="60" r="8" fill={color} opacity="0.8" />
      </svg>
    );
    case 'notebook': return (
      <svg viewBox="0 0 120 120" style={s}>
        {[0,1,2].map(i => (
          <rect key={i} x={20+i*8} y={25-i*4} width="64" height="80" rx="5" fill={color+(15-i*3).toString(16).padStart(2,'0')} stroke={color} strokeWidth="1.5" opacity={0.3+i*0.15} />
        ))}
        <rect x="36" y="20" width="64" height="80" rx="5" fill={color+'25'} stroke={color} strokeWidth="2" />
        <line x1="50" y1="42" x2="88" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="54" x2="88" y2="54" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="50" y1="66" x2="75" y2="66" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <rect x="20" y="30" width="8" height="60" rx="2" fill={color} opacity="0.4" />
      </svg>
    );
    case 'fast': return (
      <svg viewBox="0 0 120 120" style={s}>
        <circle cx="60" cy="60" r="50" fill={color+'15'} />
        {[0,1,2,3,4,5,6,7].map(i => {
          const a = (i * 45 - 90) * Math.PI / 180;
          const x = 60 + 34 * Math.cos(a), y = 60 + 34 * Math.sin(a);
          return <rect key={i} x={x-9} y={y-7} width="18" height="14" rx="3" fill={color} opacity={0.2+i*0.07} stroke={color} strokeWidth="1" />;
        })}
        <path d="M52 44 L76 60 L52 76 Z" fill={color} opacity="0.8" />
      </svg>
    );
    case 'judge': return (
      <svg viewBox="0 0 120 120" style={s}>
        <circle cx="60" cy="60" r="50" fill={color+'15'} />
        <line x1="60" y1="22" x2="60" y2="98" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="45" x2="90" y2="45" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="32" cy="58" rx="16" ry="8" fill={color+'35'} stroke={color} strokeWidth="1.5" />
        <ellipse cx="88" cy="50" rx="16" ry="8" fill={color+'20'} stroke={color} strokeWidth="1.5" opacity="0.7" />
        <path d="M24 82 L40 82 L32 70 Z" fill={color} opacity="0.5" />
        <path d="M80 76 L96 76 L88 64 Z" fill={color} opacity="0.3" />
      </svg>
    );
    case 'drive': return (
      <svg viewBox="0 0 120 120" style={s}>
        <ellipse cx="60" cy="68" rx="40" ry="24" fill={color+'25'} stroke={color} strokeWidth="2" />
        <ellipse cx="60" cy="54" rx="40" ry="24" fill={color+'30'} stroke={color} strokeWidth="2" />
        <ellipse cx="60" cy="40" rx="40" ry="24" fill={color+'35'} stroke={color} strokeWidth="2" />
        <line x1="20" y1="40" x2="20" y2="68" stroke={color} strokeWidth="2" />
        <line x1="100" y1="40" x2="100" y2="68" stroke={color} strokeWidth="2" />
        <circle cx="82" cy="40" r="6" fill={color} opacity="0.7" />
        <text x="60" y="44" textAnchor="middle" fill={color} fontSize="9" fontWeight="bold" opacity="0.8">DRIVE</text>
      </svg>
    );
    case 'chest': return (
      <svg viewBox="0 0 120 120" style={s}>
        <rect x="20" y="56" width="80" height="48" rx="8" fill={color+'25'} stroke={color} strokeWidth="2" />
        <rect x="20" y="40" width="80" height="24" rx="8" fill={color+'35'} stroke={color} strokeWidth="2" />
        <rect x="46" y="58" width="28" height="16" rx="5" fill={color} opacity="0.7" />
        <path d="M44 14 L60 6 L76 14 L68 30 L52 30 Z" fill={color} opacity="0.4" stroke={color} strokeWidth="1.5" />
        <circle cx="60" cy="20" r="5" fill={color} opacity="0.8" />
        {[...Array(4)].map((_,i) => (
          <circle key={i} cx={35+i*17} cy={76} r="3" fill={color} opacity={0.3+i*0.15} />
        ))}
      </svg>
    );
    case 'chest_cs': return (
      <svg viewBox="0 0 120 120" style={s}>
        <rect x="18" y="54" width="84" height="52" rx="8" fill={color+'25'} stroke={color} strokeWidth="2" />
        <rect x="18" y="38" width="84" height="24" rx="8" fill={color+'40'} stroke={color} strokeWidth="2" />
        <rect x="44" y="56" width="32" height="18" rx="5" fill={color} opacity="0.8" />
        <path d="M40 10 L60 2 L80 10 L70 28 L50 28 Z" fill={color} opacity="0.6" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="17" r="6" fill={color} />
        <text x="60" y="21" textAnchor="middle" fill="#000" fontSize="8" fontWeight="800">30</text>
        {[...Array(5)].map((_,i) => (
          <circle key={i} cx={28+i*16} cy={78} r="4" fill={color} opacity={0.2+i*0.15} />
        ))}
      </svg>
    );
    case 'support': return (
      <svg viewBox="0 0 120 120" style={s}>
        <circle cx="60" cy="50" r="32" fill={color+'20'} stroke={color} strokeWidth="2" />
        <circle cx="60" cy="50" r="20" fill={color+'15'} />
        <path d="M46 42 C46 30 74 30 74 46 C74 58 60 58 60 70" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="60" cy="77" r="4" fill={color} opacity="0.9" />
        <path d="M24 94 Q60 108 96 94" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        <circle cx="28" cy="86" r="3" fill={color} opacity="0.3" />
        <circle cx="92" cy="86" r="3" fill={color} opacity="0.3" />
      </svg>
    );
    case 'clean': return (
      <svg viewBox="0 0 120 120" style={s}>
        <rect x="22" y="18" width="76" height="90" rx="6" fill={color+'15'} stroke={color} strokeWidth="2" />
        <line x1="36" y1="40" x2="84" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="36" y1="52" x2="84" y2="52" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="36" y1="64" x2="68" y2="64" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <circle cx="86" cy="88" r="20" fill="#0f172a" stroke={color} strokeWidth="2" />
        <path d="M76 88 L82 94 L96 80" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
    case 'zp': return (
      <svg viewBox="0 0 120 120" style={s}>
        <circle cx="60" cy="60" r="50" fill={color+'15'} />
        <circle cx="60" cy="60" r="38" fill={color+'20'} stroke={color} strokeWidth="2" />
        <text x="60" y="52" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" opacity="0.6">100 ZP</text>
        <path d="M50 58 L60 70 L70 58" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="60" y="82" textAnchor="middle" fill={color} fontSize="14" fontWeight="800">+BONUS</text>
      </svg>
    );
    case 'image': return (
      <svg viewBox="0 0 120 120" style={s}>
        <rect x="14" y="24" width="92" height="72" rx="8" fill={color+'20'} stroke={color} strokeWidth="2" />
        <circle cx="36" cy="44" r="10" fill={color} opacity="0.5" />
        <path d="M14 72 L38 50 L58 70 L74 54 L106 80 L106 88 Q106 96 98 96 L22 96 Q14 96 14 88 Z" fill={color+'40'} />
        <circle cx="88" cy="36" r="6" fill={color} opacity="0.6" />
        <path d="M88 30 L88 18 M82 24 L94 24" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>
    );
    case 'storage': return (
      <svg viewBox="0 0 120 120" style={s}>
        {[0,1,2].map(i => (
          <rect key={i} x="22" y={28+i*24} width="76" height="18" rx="5"
            fill={color+(i===2?'45':'25')} stroke={color} strokeWidth="1.5" opacity={0.6+i*0.2} />
        ))}
        {[0,1,2].map(i => (
          <circle key={i} cx="82" cy={37+i*24} r="5" fill={color} opacity={0.5+i*0.15} />
        ))}
        <text x="44" y="41" fill={color} fontSize="9" fontWeight="700" opacity="0.8">1 TB</text>
        <text x="44" y="65" fill={color} fontSize="9" opacity="0.5">Prime Drive</text>
      </svg>
    );
    case 'guaranteed': return (
      <svg viewBox="0 0 120 120" style={s}>
        <rect x="20" y="56" width="80" height="50" rx="8" fill={color+'25'} stroke={color} strokeWidth="2" />
        <rect x="20" y="40" width="80" height="24" rx="8" fill={color+'35'} stroke={color} strokeWidth="2" />
        <rect x="46" y="58" width="28" height="16" rx="5" fill={color} opacity="0.8" />
        <circle cx="60" cy="28" r="16" fill={color+'30'} stroke={color} strokeWidth="2" />
        <path d="M52 28 L57 33 L68 22" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="60" y="100" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" opacity="0.8">%100 ŞANS</text>
      </svg>
    );
    case 'ai_edit': return (
      <svg viewBox="0 0 120 120" style={s}>
        <rect x="18" y="20" width="84" height="70" rx="6" fill={color+'15'} stroke={color} strokeWidth="2" />
        <line x1="32" y1="42" x2="88" y2="42" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="32" y1="54" x2="88" y2="54" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="32" y1="66" x2="68" y2="66" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <circle cx="88" cy="88" r="20" fill={color+'35'} stroke={color} strokeWidth="2" />
        <path d="M80 84 L84 88 L96 76" stroke={color} strokeWidth="0" />
        <text x="88" y="84" textAnchor="middle" fill={color} fontSize="8" fontWeight="700">ZETA</text>
        <text x="88" y="94" textAnchor="middle" fill={color} fontSize="7" opacity="0.7">Düzenle</text>
        <path d="M60 30 Q75 30 80 40" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" opacity="0.4" fill="none" />
      </svg>
    );
    case 'cs_exclusive': return (
      <svg viewBox="0 0 120 120" style={s}>
        <circle cx="60" cy="60" r="50" fill={color+'15'} />
        {[0,1,2,3,4].map(i => {
          const a = (i*72 - 90) * Math.PI/180;
          const x = 60 + 38*Math.cos(a), y = 60 + 38*Math.sin(a);
          return <polygon key={i} points={`${x},${y-6} ${x+5},${y+4} ${x-5},${y+4}`} fill={color} opacity={0.4+i*0.1} />;
        })}
        <circle cx="60" cy="60" r="22" fill={color+'35'} stroke={color} strokeWidth="2" />
        <text x="60" y="56" textAnchor="middle" fill={color} fontSize="8" fontWeight="700">CREATIVE</text>
        <text x="60" y="68" textAnchor="middle" fill={color} fontSize="8" fontWeight="700">STATION</text>
      </svg>
    );
    case 'star': return (
      <svg viewBox="0 0 120 120" style={s}>
        <circle cx="60" cy="60" r="50" fill={color+'15'} />
        {[0,1,2].map(i => {
          const r1 = 44-i*10, r2 = 20-i*4;
          const pts = Array.from({length:5},(_,k) => {
            const a1=(k*72-90)*Math.PI/180, a2=((k*72+36)-90)*Math.PI/180;
            return `${60+r1*Math.cos(a1)},${60+r1*Math.sin(a1)} ${60+r2*Math.cos(a2)},${60+r2*Math.sin(a2)}`;
          }).join(' ');
          return <polygon key={i} points={pts} fill={color} opacity={0.1+i*0.15} stroke={color} strokeWidth="1" />;
        })}
        <polygon
          points={Array.from({length:5},(_,k) => {
            const a1=(k*72-90)*Math.PI/180, a2=((k*72+36)-90)*Math.PI/180;
            return `${60+28*Math.cos(a1)},${60+28*Math.sin(a1)} ${60+12*Math.cos(a2)},${60+12*Math.sin(a2)}`;
          }).join(' ')}
          fill={color} opacity="0.9"
        />
      </svg>
    );
    default: return (
      <svg viewBox="0 0 120 120" style={s}>
        <circle cx="60" cy="60" r="50" fill={color+'20'} stroke={color} strokeWidth="2" />
        <circle cx="60" cy="60" r="24" fill={color} opacity="0.5" />
      </svg>
    );
  }
};

// ─── Confetti animation ───────────────────────────────────────────────────────

const Confetti = ({ color }) => {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    x: 10 + (i * 3.2) % 80,
    delay: (i * 0.13) % 2,
    duration: 1.8 + (i % 5) * 0.3,
    color: [color, '#fff', color + 'aa', '#ffffff80'][i % 4],
    shape: i % 3,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: -12,
            width: p.shape === 2 ? 8 : 6,
            height: p.shape === 2 ? 8 : 12,
            borderRadius: p.shape === 0 ? '50%' : p.shape === 2 ? '2px' : 0,
            background: p.color,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [slideIdx, setSlideIdx] = useState(-1); // -1 = tebrik ekranı
  const [showConfetti, setShowConfetti] = useState(false);

  // Poll for plan (LS webhook can be 2-5s late)
  useEffect(() => {
    let attempts = 0;
    const poll = async () => {
      try {
        const r = await axios.get(`${API}/subscription`, { withCredentials: true });
        const p = r.data.plan;
        if (p && p !== 'free') {
          setPlan(p);
          setLoading(false);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          return;
        }
      } catch {}
      attempts++;
      if (attempts < 7) setTimeout(poll, 2000);
      else setLoading(false);
    };
    setTimeout(poll, 1500);
  }, []);

  const meta = PLAN_META[plan] || { name: '', color: '#4ca8ad', glow: 'rgba(76,168,173,0.3)', emoji: '🎉', price: '' };
  const slides = SLIDES[plan] || [];
  const totalSlides = slides.length;
  const isWelcome = slideIdx === -1;
  const isQuickStart = slideIdx === totalSlides;
  const currentSlide = slides[slideIdx] || null;

  const next = useCallback(() => {
    setSlideIdx(i => Math.min(i + 1, totalSlides));
  }, [totalSlides]);

  const prev = useCallback(() => {
    setSlideIdx(i => Math.max(i - 1, -1));
  }, []);

  const skip = () => navigate('/dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #060a18 0%, #0d1230 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%', background: '#4ca8ad',
              animation: `pulse 1.2s ${i*0.2}s ease-in-out infinite`,
              opacity: 0.6,
            }} />
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Abonelik doğrulanıyor…</p>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.5)} }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 30% 20%, ${meta.glow} 0%, transparent 60%), linear-gradient(135deg, #060a18 0%, #0d1230 100%)`,
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {showConfetti && <Confetti color={meta.color} />}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', flexShrink: 0 }}>
        {/* Progress bar */}
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, marginRight: 24 }}>
          <div style={{
            height: '100%', borderRadius: 99, background: meta.color,
            width: isWelcome ? '0%' : isQuickStart ? '100%' : `${((slideIdx + 1) / totalSlides) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <button
          onClick={skip}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.45)', borderRadius: 8, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          }}
        >
          Atla
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 24px 32px' }}>

        {/* ── Welcome screen ─────────────────────────────────────── */}
        {isWelcome && (
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>{meta.emoji}</div>
            <div style={{
              display: 'inline-block',
              background: meta.color + '20', border: `1px solid ${meta.color}50`,
              borderRadius: 99, padding: '4px 16px', marginBottom: 20,
              color: meta.color, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
            }}>
              ÖDEME BAŞARILI
            </div>
            <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>
              {meta.name}{meta.name ? "'a" : ""} Hoş Geldiniz
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7, margin: '0 0 40px' }}>
              Aboneliğiniz aktifleştirildi. Şimdi size {meta.name} planının her özelliğini tanıtalım — hızlı bir tur.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={next}
                style={{
                  background: meta.color, color: '#fff', border: 'none',
                  borderRadius: 14, padding: '14px 40px',
                  fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 0 32px ${meta.color}60`,
                }}
              >
                Özellikleri Keşfet →
              </button>
              <button
                onClick={skip}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.55)', borderRadius: 14, padding: '14px 28px',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Dashboard'a Git
              </button>
            </div>
          </div>
        )}

        {/* ── Feature slide ──────────────────────────────────────── */}
        {!isWelcome && !isQuickStart && currentSlide && (
          <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
            {/* Slide counter */}
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginBottom: 32, letterSpacing: '0.06em' }}>
              {slideIdx + 1} / {totalSlides}
            </p>

            {/* Visual */}
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 32,
              filter: `drop-shadow(0 0 24px ${meta.color}50)`,
            }}>
              {currentSlide.num ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 72, fontWeight: 900, color: meta.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {currentSlide.num}
                  </div>
                  <div style={{ fontSize: 16, color: meta.color + 'aa', fontWeight: 600, marginTop: 4 }}>
                    {currentSlide.unit}
                  </div>
                </div>
              ) : (
                <Visual icon={currentSlide.icon} color={meta.color} />
              )}
            </div>

            {/* Title */}
            <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.25 }}>
              {currentSlide.title}
            </h2>

            {/* Desc */}
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, margin: '0 0 16px' }}>
              {currentSlide.desc}
            </p>

            {/* Highlight chips */}
            {currentSlide.highlight && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {currentSlide.highlight.map((h, i) => (
                  <span key={i} style={{
                    background: meta.color + '20', border: `1px solid ${meta.color}40`,
                    color: meta.color, fontSize: 12, fontWeight: 600,
                    borderRadius: 99, padding: '4px 14px',
                  }}>{h}</span>
                ))}
              </div>
            )}

            {/* Detail */}
            {currentSlide.detail && (
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '10px 16px',
                color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.6,
              }}>
                {currentSlide.detail}
              </div>
            )}
          </div>
        )}

        {/* ── Quick start screen ─────────────────────────────────── */}
        {isQuickStart && (
          <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
            <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 10px' }}>
              İlk Ne Yapmak İstiyorsunuz?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 32 }}>
              Sizi doğrudan oraya atalım.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Yeni Belge Oluştur', sub: 'Editörü aç, yazmaya başla', path: '/editor/new', icon: '📄' },
                { label: 'AI Görsel Üret', sub: 'Zeta Colors ile görsel yap', path: '/editor/new?panel=aiimage', icon: '🎨' },
                { label: 'Judge\'a Sor', sub: 'Projenizi analiz ettirin', path: '/judge', icon: '⚖️' },
                { label: 'Dashboard\'a Git', sub: 'Ana ekrana dön', path: '/dashboard', icon: '🏠' },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${meta.color}30`,
                    borderRadius: 16, padding: '20px 16px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = meta.color + '15'; e.currentTarget.style.borderColor = meta.color + '60'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = meta.color + '30'; }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{item.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      {!isWelcome && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 32px 32px', flexShrink: 0,
        }}>
          {/* Prev */}
          <button
            onClick={prev}
            style={{
              width: 48, height: 48, borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ←
          </button>

          {/* Dot indicators */}
          {!isQuickStart && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  style={{
                    width: i === slideIdx ? 20 : 6, height: 6,
                    borderRadius: 99, border: 'none', cursor: 'pointer',
                    background: i === slideIdx ? meta.color : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.25s', padding: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* Next / Finish */}
          {!isQuickStart ? (
            <button
              onClick={next}
              style={{
                height: 48, padding: '0 24px', borderRadius: 14, border: 'none',
                background: currentSlide?.isLast ? meta.color : 'rgba(255,255,255,0.1)',
                color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                boxShadow: currentSlide?.isLast ? `0 0 20px ${meta.color}50` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {currentSlide?.isLast ? 'Turu Bitir 🎯' : 'İleri →'}
            </button>
          ) : (
            <div style={{ width: 48 }} />
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
