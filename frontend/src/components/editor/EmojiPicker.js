import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

const EMOJI_CATEGORIES = {
  'Sik Kullanilan': ['😀','😂','🥹','❤️','👍','🎉','🔥','✨','💯','🙏','😍','🤔','😎','👏','💪','🫶','😢','😱','🤝','✅','❌','⭐','💡','📌','📝','🎯','💬','📢','⚡','🏆'],
  'Yuzler': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  'Jestler': ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','🫦'],
  'Kalpler': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫶','😍','🥰','😘','💑','💏','💋'],
  'Hayvanlar': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔'],
  'Yiyecekler': ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫘','🥐','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🫘','🍯','🥛','🫗','🍼','☕','🫖','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽️','🥣','🥡','🥢','🧂'],
  'Aktiviteler': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🪈','🎲','♟️','🎯','🎳','🎮','🕹️','🧩','🪅','🪩','🪆'],
  'Seyahat': ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🛺','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🛞','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🛶','🚤','🛳️','⛴️','🛥️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🌍','🌎','🌏','🗺️','🧭','🏔️','⛰️','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🌋','🗾','🏠','🏡','🏘️','🏚️','🏗️','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩️','🕋','⛲','⛺','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','🎠','🛝','🎡','🎢','💈','🎪','🗿'],
  'Nesneler': ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','🩻','🩼','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🧼','🫧','🪥','🧽','🧯','🛒','🚬','⚰️','🪦','⚱️','🗿','🪧','🪪'],
  'Semboller': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❣️','💕','💞','💓','💗','💖','💘','💝','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚻','🚼','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','👁️‍🗨️','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛'],
  'Bayraklar': ['🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🇹🇷','🇺🇸','🇬🇧','🇩🇪','🇫🇷','🇪🇸','🇮🇹','🇯🇵','🇰🇷','🇨🇳','🇷🇺','🇧🇷','🇮🇳','🇦🇺','🇨🇦','🇲🇽','🇦🇷','🇸🇦','🇦🇪','🇪🇬','🇳🇬','🇿🇦','🇮🇱','🇵🇰','🇮🇩','🇹🇭','🇻🇳','🇵🇭','🇲🇾','🇸🇬','🇳🇱','🇧🇪','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇵🇱','🇨🇿','🇦🇹','🇨🇭','🇬🇷','🇵🇹','🇮🇪','🇭🇺','🇷🇴','🇺🇦','🇭🇷','🇷🇸','🇧🇬','🇱🇹','🇱🇻','🇪🇪','🇬🇪','🇦🇿','🇰🇿','🇺🇿','🇹🇲']
};

export default function EmojiPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Sik Kullanilan');

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES[activeCategory] || [];
    const all = Object.values(EMOJI_CATEGORIES).flat();
    // Simple search - just return all for now since emoji search by name needs a mapping
    return [...new Set(all)];
  }, [search, activeCategory]);

  const handleSelect = (emoji) => {
    onSelect(emoji);
    // Add to recently used in localStorage
    try {
      const recent = JSON.parse(localStorage.getItem('zet_recent_emojis') || '[]');
      const updated = [emoji, ...recent.filter(e => e !== emoji)].slice(0, 30);
      localStorage.setItem('zet_recent_emojis', JSON.stringify(updated));
    } catch {}
  };

  const recentEmojis = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('zet_recent_emojis') || '[]'); } catch { return []; }
  }, []);

  const categoryKeys = Object.keys(EMOJI_CATEGORIES);

  return (
    <div data-testid="emoji-picker" className="w-80 rounded-xl shadow-2xl overflow-hidden" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
      {/* Search */}
      <div className="p-2 border-b" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'var(--zet-bg)' }}>
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--zet-text-muted)' }} />
          <input data-testid="emoji-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Emoji ara..." className="bg-transparent text-xs flex-1 outline-none" style={{ color: 'var(--zet-text)' }} />
          {search && <button onClick={() => setSearch('')}><X className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} /></button>}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-0.5 px-2 py-1 overflow-x-auto border-b" style={{ borderColor: 'var(--zet-border)' }}>
        {recentEmojis.length > 0 && (
          <button data-testid="emoji-cat-recent" onClick={() => { setActiveCategory('__recent'); setSearch(''); }}
            className={`px-2 py-1 rounded text-[10px] whitespace-nowrap shrink-0 ${activeCategory === '__recent' ? 'font-bold' : ''}`}
            style={{ background: activeCategory === '__recent' ? 'var(--zet-primary-light)' : 'transparent', color: activeCategory === '__recent' ? '#fff' : 'var(--zet-text-muted)' }}>
            Son
          </button>
        )}
        {categoryKeys.map(cat => (
          <button key={cat} data-testid={`emoji-cat-${cat.replace(/\s/g, '-')}`} onClick={() => { setActiveCategory(cat); setSearch(''); }}
            className={`px-2 py-1 rounded text-[10px] whitespace-nowrap shrink-0 ${activeCategory === cat ? 'font-bold' : ''}`}
            style={{ background: activeCategory === cat ? 'var(--zet-primary-light)' : 'transparent', color: activeCategory === cat ? '#fff' : 'var(--zet-text-muted)' }}>
            {cat === 'Sik Kullanilan' ? '⭐' : cat === 'Yuzler' ? '😀' : cat === 'Jestler' ? '👋' : cat === 'Kalpler' ? '❤️' : cat === 'Hayvanlar' ? '🐶' : cat === 'Yiyecekler' ? '🍕' : cat === 'Aktiviteler' ? '⚽' : cat === 'Seyahat' ? '🚗' : cat === 'Nesneler' ? '💡' : cat === 'Semboller' ? '❤️' : cat === 'Bayraklar' ? '🏳️' : cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-2 h-56 overflow-y-auto">
        <div className="text-[10px] mb-1 font-medium" style={{ color: 'var(--zet-text-muted)' }}>
          {activeCategory === '__recent' ? 'Son Kullanilan' : activeCategory}
        </div>
        <div className="grid grid-cols-8 gap-0.5">
          {(activeCategory === '__recent' ? recentEmojis : (search ? filteredEmojis : (EMOJI_CATEGORIES[activeCategory] || []))).map((emoji, i) => (
            <button key={`${emoji}-${i}`} data-testid={`emoji-${i}`} onClick={() => handleSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-xl transition-transform hover:scale-125 cursor-pointer">
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
