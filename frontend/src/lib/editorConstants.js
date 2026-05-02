import {
  Type, Image, Hand, FileText, Baseline, ALargeSmall,
  Volume2, FilePlus,
  Pencil, Palette, Scissors, Wand2, MousePointer2,
  Eraser, PenTool, Languages, AlignJustify, Bold, Highlighter,
  AlignLeft, BarChart3, Contrast, Layers, Ruler,
  Grid3X3, LayoutTemplate, Table, QrCode, Droplets, Hash,
  PanelTop, Search, Copy, FlipHorizontal2, Mic, ImagePlus, PenLine,
  IndentIncrease, Maximize, ShieldOff, FileUp, List, ListOrdered, SmilePlus,
  Shapes, Pilcrow, ZoomIn, Columns3
} from 'lucide-react';

// 96 DPI screen pixels — matches Word/browser 100% zoom (1pt = 96/72 = 1.333px)
export const PAGE_SIZES = [
  { name: 'A4', width: 794, height: 1123 },
  { name: 'A5', width: 559, height: 794 },
  { name: 'Letter', width: 816, height: 1056 },
  { name: 'Legal', width: 816, height: 1344 },
  { name: 'Square', width: 794, height: 794 },
];

export const FONTS = [
  // === Sans-Serif (Modern) ===
  'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Geneva',
  'Lucida Grande', 'Lucida Sans', 'Segoe UI', 'Open Sans', 'Roboto',
  'Lato', 'Montserrat', 'Poppins', 'Nunito', 'Ubuntu', 'Inter',
  'Source Sans Pro', 'Work Sans', 'Karla', 'Manrope', 'DM Sans',
  'Quicksand', 'Outfit', 'Figtree', 'Plus Jakarta Sans',
  // === Serif (Klasik) ===
  'Times New Roman', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
  'Cambria', 'Constantia', 'Didot', 'Baskerville', 'Bodoni',
  'Merriweather', 'Playfair Display', 'Libre Baskerville', 'Crimson Text',
  'Lora', 'EB Garamond', 'Cormorant', 'Spectral', 'Bitter',
  // === Monospace (Kod) ===
  'Courier New', 'Lucida Console', 'Monaco', 'Consolas', 'Source Code Pro',
  'Fira Code', 'JetBrains Mono', 'IBM Plex Mono', 'Space Mono', 'Roboto Mono',
  // === Display & Decorative ===
  'Impact', 'Comic Sans MS', 'Brush Script MT', 'Copperplate',
  'Rockwell', 'Century Gothic', 'Avant Garde', 'Futura', 'Gill Sans',
  'Optima', 'Franklin Gothic', 'Bebas Neue', 'Oswald', 'Raleway',
  // === Türkçe Uyumlu ===
  'Noto Sans', 'Noto Serif', 'PT Sans', 'PT Serif', 'Rubik', 'Exo 2',
  'Titillium Web', 'Cabin', 'Mulish', 'Barlow', 'Lexend', 'Sora',
  // === El Yazısı & Script ===
  'Dancing Script', 'Pacifico', 'Great Vibes', 'Satisfy', 'Caveat',
  'Kalam', 'Indie Flower', 'Shadows Into Light', 'Patrick Hand',
  // === Başlık Fontları ===
  'Anton', 'Archivo Black', 'Russo One', 'Righteous', 'Fredoka One',
  'Alfa Slab One', 'Lilita One', 'Passion One', 'Bangers', 'Permanent Marker',
  // === A ===
  'ABeeZee', 'Abel', 'Abhaya Libre', 'Abril Fatface', 'Acme', 'Actor',
  'Adamina', 'Advent Pro', 'Agbalumo', 'Agdasima', 'Akshar', 'Albert Sans',
  'Aldrich', 'Alef', 'Alegreya', 'Alegreya SC', 'Alegreya Sans', 'Alegreya Sans SC',
  'Aleo', 'Alex Brush', 'Alice', 'Alike', 'Alike Angular', 'Allan',
  'Allerta', 'Allerta Stencil', 'Allison', 'Allura', 'Almendra', 'Almendra SC',
  'Alumni Sans', 'Amatic SC', 'Amethysta', 'Amiko', 'Amiri', 'Amira',
  'Anaheim', 'Andada Pro', 'Andika', 'Annie Use Your Telescope', 'Anonymous Pro',
  'Antic', 'Antic Didone', 'Antic Slab', 'Antonio', 'Anybody', 'Aoboshi One',
  'Arapey', 'Arbutus', 'Arbutus Slab', 'Architects Daughter', 'Arimo',
  'Arizonia', 'Armata', 'Arsenal', 'Artifika', 'Arvo', 'Asap',
  'Asap Condensed', 'Asar', 'Atkinson Hyperlegible', 'Atma', 'Atomic Age',
  'Audiowide', 'Average', 'Average Sans', 'Averia Libre', 'Averia Sans Libre',
  'Azeret Mono',
  // === B ===
  'Babylonica', 'Bad Script', 'Baloo 2', 'Baloo Bhai 2', 'Balsamiq Sans',
  'Balthazar', 'Barlow Condensed', 'Barlow Semi Condensed', 'Barriecito',
  'Belgrano', 'Bellefair', 'Belleza', 'Bellota', 'BenchNine',
  'Boogaloo', 'Bowlby One', 'Brawler', 'Bree Serif', 'Bruno Ace',
  'Bubblegum Sans', 'Bubbler One', 'Buda', 'Buenard',
  // === C ===
  'Cabin Condensed', 'Cabin Sketch', 'Caesar Dressing', 'Cairo',
  'Caladea', 'Calistoga', 'Calligraffitti', 'Cambay', 'Cambo',
  'Candal', 'Cantarell', 'Cantata One', 'Cantora One', 'Capriola',
  'Caramel', 'Carattere', 'Cardo', 'Carlito', 'Carme', 'Carrois Gothic',
  'Carter One', 'Catamaran', 'Caudex', 'Caveat Brush', 'Cedarville Cursive',
  'Ceviche One', 'Chakra Petch', 'Changa', 'Changa One', 'Chango',
  'Charm', 'Charmonman', 'Chelsea Market', 'Cherry Cream Soda', 'Cherry Swash',
  'Chewy', 'Chicle', 'Chivo', 'Chivo Mono', 'Cinzel', 'Cinzel Decorative',
  'Clicker Script', 'Coda', 'Codystar', 'Coiny', 'Comfortaa', 'Comic Neue',
  'Coming Soon', 'Commissioner', 'Concert One', 'Content', 'Contrail One',
  'Convergence', 'Cookie', 'Copse', 'Cormorant Garamond', 'Cormorant Infant',
  'Cormorant SC', 'Cormorant Upright', 'Courgette', 'Courier Prime',
  'Cousine', 'Coustard', 'Covered By Your Grace', 'Creepster', 'Crete Round',
  'Crimson Pro', 'Croissant One', 'Crushed', 'Cuprum', 'Cutive', 'Cutive Mono',
  // === D ===
  'DM Mono', 'DM Serif Display', 'DM Serif Text', 'Damion', 'Danfo',
  'Darker Grotesque', 'Darumadrop One', 'David Libre', 'Dawning of a New Day',
  'Days One', 'Dekko', 'Delius', 'Delius Swash Caps', 'Delius Unicase',
  'Della Respira', 'Devonshire', 'Do Hyeon', 'Dokdo', 'Donegal One',
  'Dongle', 'Doppio One', 'Dosis', 'Duru Sans', 'Dynalight',
  // === E ===
  'Eagle Lake', 'Eczar', 'El Messiri', 'Electrolize', 'Elsie',
  'Encode Sans', 'Encode Sans Condensed', 'Encode Sans Expanded',
  'Epilogue', 'Erica One', 'Esteban', 'Estonia', 'Euphoria Script',
  'Expletus Sans', 'Explora',
  // === F ===
  'Fahkwang', 'Familjen Grotesk', 'Fanwood Text', 'Fascinate',
  'Faster One', 'Faustina', 'Federo', 'Felipa', 'Fenix', 'Festive',
  'Finger Paint', 'Finlandica', 'Fira Mono', 'Fira Sans',
  'Fira Sans Condensed', 'Fjalla One', 'Fjord One', 'Flamenco',
  'Flavors', 'Foldit', 'Fondamento', 'Forum', 'Francois One',
  'Frank Ruhl Libre', 'Fraunces', 'Freckle Face', 'Fredericka the Great',
  'Freehand', 'Fresca', 'Frijole', 'Fugaz One', 'Fuzzy Bubbles',
  // === G ===
  'GFS Didot', 'Gabriela', 'Gayathri', 'Gelasio', 'Gemunu Libre',
  'Genos', 'Gentium Book Basic', 'Gentium Plus', 'Geo', 'Georama',
  'Gideon Roman', 'Gilda Display', 'Gochi Hand', 'Goldman', 'Gotu',
  'Graduate', 'Grand Hotel', 'Grenze', 'Grenze Gotisch', 'Grey Qo',
  'Griffy', 'Gruppo', 'Gudea', 'Gugi',
  // === H ===
  'Hahmlet', 'Hammersmith One', 'Hanalei', 'Handjet', 'Happy Monkey',
  'Harmattan', 'Headland One', 'Heebo', 'Henny Penny', 'Hepta Slab',
  'Herr Von Muellerhoff', 'Hi Melody', 'Hina Mincho', 'Holtwood One SC',
  'Homemade Apple', 'Homenaje', 'Hubballi', 'Hurricane',
  // === I ===
  'IBM Plex Sans', 'IBM Plex Sans Condensed', 'IBM Plex Serif',
  'Ibarra Real Nova', 'Inika', 'Inknut Antiqua', 'Inria Sans', 'Inria Serif',
  'Inspiration', 'Instrument Sans', 'Instrument Serif', 'Inter Tight', 'Imbue',
  // === J ===
  'Jacques Francois', 'Jacques Francois Shadow', 'Jaldi', 'Joan',
  'Josefin Sans', 'Josefin Slab', 'Jost', 'Jua', 'Judson', 'Julee',
  'Julius Sans One', 'Junge', 'Jura', 'Just Another Hand',
  'Just Me Again Down Here',
  // === K ===
  'Kaisei Decol', 'Kaisei HarunoUmi', 'Kaisei Opti', 'Kaisei Tokumin',
  'Kantumruy Pro', 'Karma', 'Katibeh', 'Keania One', 'Kelly Slab',
  'Khand', 'Kite One', 'Kiwi Maru', 'Klee One', 'Knewave', 'KoHo',
  'Kotta One', 'Kreon', 'Kristi', 'Krona One', 'Krub', 'Kufam',
  'Kulim Park', 'Kumbh Sans', 'Kurale',
  // === L ===
  'La Belle Aurore', 'Lacquer', 'Laila', 'Lalezar', 'Lancelot',
  'Langar', 'Lateef', 'League Gothic', 'League Spartan', 'Leckerli One',
  'Ledger', 'Lekton', 'Lemon', 'Lemonada', 'Lexend Deca', 'Lexend Exa',
  'Lexend Giga', 'Lexend Mega', 'Lexend Peta', 'Lexend Tera', 'Lexend Zetta',
  'Libre Franklin', 'Life Savers', 'Lily Script One', 'Limelight',
  'Literata', 'Livvic', 'Lobster', 'Lobster Two', 'Londrina Solid',
  'Love Light', 'Loved by the King', 'Luckiest Guy', 'Lusitana',
  'Lustria', 'Luxurious Roman', 'Luxurious Script',
  // === M ===
  'M PLUS 1', 'M PLUS 1p', 'M PLUS 2', 'M PLUS Rounded 1c',
  'Macondo', 'Macondo Swash Caps', 'Mada', 'Magra', 'Maiden Orange',
  'Maitree', 'Major Mono Display', 'Mako', 'Mali', 'Mallanna',
  'Mandali', 'Manjari', 'Mansalva', 'Marcellus', 'Marcellus SC',
  'Marck Script', 'Margarine', 'Markazi Text', 'Martel', 'Martel Sans',
  'Marvel', 'Mate', 'Mate SC', 'Maven Pro', 'McLaren', 'Meie Script',
  'Meow Script', 'Merienda', 'Merriweather Sans', 'Metamorphous',
  'Metrophobic', 'Michroma', 'Milonga', 'Miniver', 'Miriam Libre',
  'Mirza', 'Mitr', 'Modak', 'Modern Antiqua', 'Mogra', 'Mohave',
  'Molengo', 'Molle', 'Monda', 'Monsieur La Doulaise', 'Montez',
  'Mountains of Christmas', 'Mouse Memoirs', 'Mr Bedfort', 'Mr Dafoe',
  'Mr De Haviland', 'Mrs Saint Delafield', 'Mukta', 'Murecho',
  'Museomoderno', 'My Soul',
  // === N ===
  'NTR', 'Nanum Brush Script', 'Nanum Gothic', 'Nanum Gothic Coding',
  'Nanum Myeongjo', 'Nanum Pen Script', 'Neonderthaw', 'Nerko One',
  'Neucha', 'Neuton', 'New Rocker', 'News Cycle', 'Newsreader',
  'Niramit', 'Nixie One', 'Nobile', 'Norican', 'Nosifer', 'Notable',
  'Nothing You Could Do', 'Noticia Text', 'Nova Cut', 'Nova Flat',
  'Nova Mono', 'Nova Oval', 'Nova Round', 'Nova Script', 'Nova Slim',
  'Nova Square', 'Numans',
  // === O ===
  'Old Standard TT', 'Oldenburg', 'Ole', 'Oleo Script',
  'Oleo Script Swash Caps', 'Orbit', 'Orbitron', 'Oregano',
  'Oranienbaum', 'Original Surfer', 'Oxanium', 'Oxygen', 'Oxygen Mono',
  // === P ===
  'PT Mono', 'PT Serif Caption', 'Padauk', 'Palanquin', 'Palanquin Dark',
  'Pangolin', 'Paprika', 'Parisienne', 'Passero One', 'Passions Conflict',
  'Pathway Gothic One', 'Patua One', 'Pattaya', 'Paytone One',
  'Peralta', 'Petit Formal Script', 'Petrona', 'Philosopher', 'Piedra',
  'Piazzolla', 'Pinyon Script', 'Pirata One', 'Pixelify Sans', 'Play',
  'Playball', 'Playfair Display SC', 'Playpen Sans', 'Podkova',
  'Poiret One', 'Poller One', 'Poly', 'Pompiere', 'Pontano Sans',
  'Poor Story', 'Potta One', 'Pragati Narrow', 'Praise', 'Prata',
  'Press Start 2P', 'Pridi', 'Princess Sofia', 'Prociono', 'Prompt',
  'Proza Libre', 'Public Sans',
  // === Q ===
  'Qahiri', 'Quando', 'Quantico', 'Quattrocento', 'Quattrocento Sans',
  'Questrial', 'Quintessential', 'Qwigley',
  // === R ===
  'Racing Sans One', 'Radley', 'Rajdhani', 'Rakkas', 'Ramabhadra',
  'Rambla', 'Rammetto One', 'Rampart One', 'Rancho', 'Rasa',
  'Rationale', 'Readex Pro', 'Recursive', 'Red Hat Display', 'Red Hat Mono',
  'Red Hat Text', 'Red Rose', 'Reenie Beanie', 'Reggae One', 'Revalia',
  'Ribeye', 'Ribeye Marrow', 'Risque', 'Road Rage', 'Roboto Condensed',
  'Roboto Slab', 'Rochester', 'Rock Salt', 'RocknRoll One', 'Rokkitt',
  'Romanesco', 'Ropa Sans', 'Rosario', 'Rosarivo', 'Rouge Script',
  'Rowdies', 'Rozha One', 'Rum Raisin', 'Ruslan Display',
  // === S ===
  'Sacramento', 'Sail', 'Saira', 'Saira Condensed', 'Saira Semi Condensed',
  'Salsa', 'Sanchez', 'Sancreek', 'Sansita', 'Sansita Swashed',
  'Sarabun', 'Sarina', 'Sarpanch', 'Sawarabi Gothic', 'Scada',
  'Scope One', 'Seaweed Script', 'Secular One', 'Sen', 'Seymour One',
  'Shadows Into Light Two', 'Shanti', 'Share', 'Share Tech', 'Share Tech Mono',
  'Shippori Mincho', 'Shrikhand', 'Sigmar', 'Sigmar One', 'Signika',
  'Signika Negative', 'Single Day', 'Six Caps', 'Slabo 13px', 'Slabo 27px',
  'Smokum', 'Smooch', 'Smooch Sans', 'Sniglet', 'Sofia', 'Sofia Sans',
  'Sofia Sans Condensed', 'Sofia Sans Extra Condensed',
  'Sofia Sans Semi Condensed', 'Solitreo', 'Solway', 'Song Myung',
  'Sonsie One', 'Sorts Mill Goudy', 'Source Serif 4', 'Space Grotesk',
  'Spicy Rice', 'Spinnaker', 'Spirax', 'Squada One', 'Sriracha',
  'Staatliches', 'Stalemate', 'Stalinist One', 'Stardos Stencil',
  'Stint Ultra Condensed', 'Stoke', 'Strait', 'Style Script',
  'Sue Ellen Francisco', 'Suez One', 'Sulphur Point', 'Sura', 'Suranna',
  'Swanky and Moo Moo', 'Syncopate',
  // === T ===
  'Tajawal', 'Tangerine', 'Tapestry', 'Tauri', 'Taviraj', 'Teko',
  'Telex', 'Tenali Ramakrishna', 'Tenor Sans', 'Text Me One', 'Thasadith',
  'The Girl Next Door', 'The Nautigal', 'Tienne', 'Tillana', 'Timmana',
  'Tinos', 'Titan One', 'Tomorrow', 'Tourney', 'Trade Winds', 'Train One',
  'Trirong', 'Trocchi', 'Trochut', 'Truculenta', 'Trykker', 'Turret Road',
  // === U ===
  'Ubuntu Condensed', 'Ubuntu Mono', 'Ultra', 'Unica One', 'Unkempt',
  'Unna', 'Urbanist',
  // === V ===
  'Vampiro One', 'Varela', 'Varela Round', 'Vast Shadow', 'Vesper Libre',
  'Viaoda Libre', 'Vibur', 'Viga', 'Voces', 'Vollkorn', 'Vollkorn SC',
  // === W ===
  'Wallpoet', 'Walter Turncoat', 'Warnes', 'Waterfall', 'Wellfleet',
  'Wendy One', 'WindSong', 'Wire One',
  // === X-Y-Z ===
  'Xanh Mono', 'Yanone Kaffeesatz', 'Yantramanav', 'Yellowtail',
  'Yeon Sung', 'Yeseva One', 'Yesteryear', 'Yomogi', 'Young Serif',
  'Yrsa', 'Ysabeau', 'Ysabeau Infant', 'Ysabeau Office', 'Ysabeau SC',
  'Yuji Boku', 'Yuji Mai', 'ZCOOL KuaiLe', 'ZCOOL QingKe HuangYou',
  'Zen Antique', 'Zen Antique Soft', 'Zen Dots', 'Zen Kaku Gothic Antique',
  'Zen Kaku Gothic New', 'Zen Kurenaido', 'Zen Loop', 'Zen Maru Gothic',
  'Zen Old Mincho', 'Zeyada', 'Zilla Slab',
];

export const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FF6600', '#6600FF', '#00FF66', '#FF0066',
  '#292f91', '#4ca8ad', '#333333', '#666666', '#999999', '#CCCCCC'
];

export const TOOLS = [
  { id: 'wordtype', icon: Bold, nameKey: 'wordType', shortcut: 'B' },
  { id: 'textsize', icon: Baseline, nameKey: 'textSize', shortcut: null },
  { id: 'font', icon: ALargeSmall, nameKey: 'font', shortcut: 'F' },
  { id: 'linespacing', icon: AlignJustify, nameKey: 'lineSpacing', shortcut: null },
  { id: 'paragraph', icon: AlignLeft, nameKey: 'paragraph', shortcut: 'A' },
  { id: 'indent', icon: IndentIncrease, nameKey: 'indent', shortcut: null },
  { id: 'bulletlist', icon: List, nameKey: 'bulletList', shortcut: null },
  { id: 'numberedlist', icon: ListOrdered, nameKey: 'numberedList', shortcut: null },
  { id: 'margins', icon: Maximize, nameKey: 'margins', shortcut: null },
  { id: 'columns', icon: Columns3, nameKey: 'columns', shortcut: null },
  { id: 'color', icon: Palette, nameKey: 'colorPicker', shortcut: 'C' },
  { id: 'text', icon: Type, nameKey: 'text', shortcut: 'T' },
  { id: 'hand', icon: Hand, nameKey: 'pan', shortcut: 'H' },
  { id: 'image', icon: Image, nameKey: 'image', shortcut: 'I' },
  { id: 'createimage', icon: Wand2, nameKey: 'aiImage', shortcut: 'W' },
  { id: 'photoedit', icon: ImagePlus, nameKey: 'photoEdit', shortcut: null },
  { id: 'signature', icon: PenLine, nameKey: 'signature', shortcut: null },
  { id: 'draw', icon: Pencil, nameKey: 'pencil', shortcut: 'D' },
  { id: 'pen', icon: PenTool, nameKey: 'penTool', shortcut: 'P' },
  { id: 'eraser', icon: Eraser, nameKey: 'eraser', shortcut: 'E' },
  { id: 'select', icon: MousePointer2, nameKey: 'select', shortcut: 'S' },
  { id: 'copy', icon: Copy, nameKey: 'copy', shortcut: null },
  { id: 'mirror', icon: FlipHorizontal2, nameKey: 'mirror', shortcut: null },
  { id: 'cut', icon: Scissors, nameKey: 'crop', shortcut: 'X' },
  { id: 'redact', icon: ShieldOff, nameKey: 'redact', shortcut: null },
  { id: 'highlighter', icon: Highlighter, nameKey: 'highlighter', shortcut: null },
  { id: 'emoji', icon: SmilePlus, nameKey: 'emoji', shortcut: null },
  { id: 'importpdf', icon: FileUp, nameKey: 'importPdf', shortcut: null },
  { id: 'translate', icon: Languages, nameKey: 'translate', shortcut: 'L' },
  { id: 'graphic', icon: BarChart3, nameKey: 'graphic', shortcut: 'G' },
  { id: 'table', icon: Table, nameKey: 'table', shortcut: null },
  { id: 'layers', icon: Layers, nameKey: 'layers', shortcut: null },
  { id: 'ruler', icon: Ruler, nameKey: 'ruler', shortcut: 'R' },
  { id: 'grid', icon: Grid3X3, nameKey: 'grid', shortcut: null },
  { id: 'templates', icon: LayoutTemplate, nameKey: 'templates', shortcut: null },
  { id: 'qrcode', icon: QrCode, nameKey: 'qrcode', shortcut: 'Q' },
  { id: 'watermark', icon: Droplets, nameKey: 'watermark', shortcut: null },
  { id: 'pagenumbers', icon: Hash, nameKey: 'pageNumbers', shortcut: null },
  { id: 'headerfooter', icon: PanelTop, nameKey: 'headerFooter', shortcut: null },
  { id: 'findreplace', icon: Search, nameKey: 'findReplace', shortcut: null },
  { id: 'pagecolor', icon: Contrast, nameKey: 'pageColor', shortcut: null },
  { id: 'addpage', icon: FilePlus, nameKey: 'addPage', shortcut: 'N' },
  { id: 'pagesize', icon: FileText, nameKey: 'pageSize', shortcut: null },
  { id: 'voice', icon: Volume2, nameKey: 'voice', shortcut: 'V' },
  { id: 'voiceinput', icon: Mic, nameKey: 'voiceInput', shortcut: null },
  { id: 'shapes', icon: Shapes, nameKey: 'shapes', shortcut: null },
  { id: 'punctuation', icon: Pilcrow, nameKey: 'punctuation', shortcut: null },
  { id: 'zoom', icon: ZoomIn, nameKey: 'zoomTool', shortcut: 'Z' },
];

// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS = TOOLS.reduce((acc, tool) => {
  if (tool.shortcut) acc[tool.shortcut] = tool.id;
  return acc;
}, {});

export const TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'tr', name: 'Türkçe' },
  { code: 'de', name: 'Deutsch' }, { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' }, { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' }, { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' }, { code: 'ar', name: 'العربية' },
];

export const LINE_SPACINGS = [1.0, 1.15, 1.5, 2.0, 2.5, 3.0];

export const TEXT_ALIGNMENTS = [
  { id: 'left', nameKey: 'alignLeft' },
  { id: 'center', nameKey: 'alignCenter' },
  { id: 'right', nameKey: 'alignRight' },
  { id: 'justify', nameKey: 'alignJustify' },
];

export const CHART_TYPES = [
  { id: 'bar', name: 'Bar Chart' },
  { id: 'pie', name: 'Pie Chart' },
  { id: 'line', name: 'Line Chart' },
];

export const TEMPLATES = [
  { id: 'blank', name: 'Boş Belge', nameKey: 'templateBlank', icon: '📄', category: 'Temel' },
  { id: 'cv', name: 'CV / Özgeçmiş', nameKey: 'templateCV', icon: '👤', category: 'Kariyer' },
  { id: 'report', name: 'Rapor', nameKey: 'templateReport', icon: '📊', category: 'İş' },
  { id: 'presentation', name: 'Sunum', nameKey: 'templatePresentation', icon: '📽️', category: 'İş' },
  { id: 'letter', name: 'Mektup', nameKey: 'templateLetter', icon: '✉️', category: 'Kişisel' },
  { id: 'invoice', name: 'Fatura', nameKey: 'templateInvoice', icon: '🧾', category: 'İş' },
  { id: 'meeting', name: 'Toplantı Notları', nameKey: 'templateMeeting', icon: '📝', category: 'İş' },
  { id: 'proposal', name: 'Teklif / Proposal', nameKey: 'templateProposal', icon: '💼', category: 'İş' },
  { id: 'contract', name: 'Sözleşme', nameKey: 'templateContract', icon: '📜', category: 'Hukuki' },
  { id: 'newsletter', name: 'Bülten', nameKey: 'templateNewsletter', icon: '📰', category: 'Pazarlama' },
  { id: 'recipe', name: 'Tarif Kartı', nameKey: 'templateRecipe', icon: '🍳', category: 'Kişisel' },
  { id: 'projectplan', name: 'Proje Planı', nameKey: 'templateProject', icon: '🎯', category: 'İş' },
  { id: 'certificate', name: 'Sertifika', nameKey: 'templateCertificate', icon: '🏆', category: 'Eğitim' },
  { id: 'checklist', name: 'Kontrol Listesi', nameKey: 'templateChecklist', icon: '✅', category: 'Kişisel' },
  { id: 'brainstorm', name: 'Beyin Fırtınası', nameKey: 'templateBrainstorm', icon: '💡', category: 'Yaratıcı' },
  { id: 'socialmedia', name: 'Sosyal Medya', nameKey: 'templateSocial', icon: '📱', category: 'Pazarlama' },
  // Yeni Eklenen Şablonlar
  { id: 'weeklyplan', name: 'Haftalık Plan', nameKey: 'templateWeekly', icon: '📅', category: 'Kişisel' },
  { id: 'swot', name: 'SWOT Analizi', nameKey: 'templateSwot', icon: '🔍', category: 'İş' },
  { id: 'blogpost', name: 'Blog Yazısı', nameKey: 'templateBlog', icon: '✍️', category: 'Yaratıcı' },
  { id: 'eventflyer', name: 'Etkinlik Afişi', nameKey: 'templateEvent', icon: '🎉', category: 'Pazarlama' },
  { id: 'academic', name: 'Akademik Makale', nameKey: 'templateAcademic', icon: '🎓', category: 'Eğitim' },
  { id: 'creative-brief', name: 'Kreatif Brief', nameKey: 'templateCreativeBrief', icon: '🎨', category: 'Yaratıcı' },
];

export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT = 'Arial';
export const DEFAULT_COLOR = '#000000';
export const DEFAULT_ZOOM = 0.75;
