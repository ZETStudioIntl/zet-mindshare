// ============================================================
// ZET Mindshare — .ms Format Core Engine
// Version: 1.0.0
// ============================================================

// --- ENCRYPTION (Black Band) ---
const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

async function generateKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("ZETMindshare_BlackBand_Salt_v1"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptBlackBand(data, password) {
  const key = await generateKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    enc.encode(data)
  );
  return {
    iv: btoa(String.fromCharCode(...iv)),
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  };
}

export async function decryptBlackBand(encryptedData, iv, password) {
  const key = await generateKey(password);
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const dataBytes = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGORITHM, iv: ivBytes },
    key,
    dataBytes
  );
  return new TextDecoder().decode(decrypted);
}

// --- HELPERS ---
function countWords(doc) {
  return doc.pages.reduce((total, page) => {
    return total + page.blocks.reduce((pTotal, block) => {
      if (block.type === "paragraph" || block.type === "heading") {
        return pTotal + (block.content?.trim().split(/\s+/).filter(Boolean).length ?? 0);
      }
      return pTotal;
    }, 0);
  }, 0);
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- SERIALIZER ---
export function serializeMS(doc) {
  const updated = {
    ...doc,
    meta: {
      ...doc.meta,
      updatedAt: new Date().toISOString(),
      wordCount: countWords(doc),
      pageCount: doc.pages.length,
    },
  };
  return JSON.stringify(updated, null, 0);
}

export function deserializeMS(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed.version) {
    throw new Error("Gecersiz .ms dosyasi -- versiyon bilgisi bulunamadi.");
  }
  return parsed;
}

// --- CONVERTER: Editor Document -> MS Format ---
export function convertToMSFormat(editorDoc, canvasElements, drawPaths, pageSize, pageBackground, userPlan) {
  const now = new Date().toISOString();
  const pages = (editorDoc.pages || []).map((page, idx) => {
    const elements = page.elements || [];
    const blocks = elements.map((el) => {
      const block = {
        id: el.id,
        type: el.type === 'text' ? 'paragraph' : el.type === 'image' ? 'image' : el.type === 'shape' ? 'image' : el.type,
        content: el.htmlContent || el.content || '',
        format: {
          fontSize: el.fontSize,
          fontFamily: el.fontFamily || el.font,
          fontWeight: el.bold ? 'bold' : 'normal',
          italic: !!el.italic,
          underline: !!el.underline,
          strikethrough: !!el.strikethrough,
          color: el.color,
          backgroundColor: el.highlightColor || el.background,
          alignment: el.textAlign || 'left',
          lineHeight: el.lineHeight,
          indent: el.paddingLeft || 0,
        },
      };
      if (el.type === 'image' || el.type === 'chart' || el.type === 'table') {
        block.format.assetId = el.id;
        block.format.width = el.width;
        block.format.height = el.height;
      }
      if (el.type === 'table') {
        block.format.rows = el.rows;
        block.format.cols = el.cols;
      }
      return block;
    });
    return { id: page.page_id || generateId(), index: idx, blocks };
  });

  // Collect image assets
  const imageAssets = [];
  (editorDoc.pages || []).forEach((page) => {
    (page.elements || []).forEach((el) => {
      if ((el.type === 'image' || el.type === 'chart') && el.src) {
        const mimeMatch = el.src.match(/^data:([^;]+);/);
        imageAssets.push({
          id: el.id,
          name: el.id,
          mimeType: mimeMatch ? mimeMatch[1] : 'image/png',
          data: el.src.includes(',') ? el.src.split(',')[1] : el.src,
          width: el.width || 0,
          height: el.height || 0,
          createdAt: now,
          source: 'upload',
        });
      }
    });
  });

  // Detect black band blocks
  const blackBandBlockIds = [];
  (editorDoc.pages || []).forEach((page) => {
    (page.elements || []).forEach((el) => {
      if (el.isRedacted || (el.htmlContent && el.htmlContent.includes('data-redacted="true"'))) {
        blackBandBlockIds.push(el.id);
      }
    });
  });

  // Count total words
  let totalWords = 0;
  (editorDoc.pages || []).forEach((page) => {
    (page.elements || []).forEach((el) => {
      if (el.type === 'text') {
        const text = (el.content || '').trim();
        if (text) totalWords += text.split(/\s+/).filter(Boolean).length;
      }
    });
  });

  return {
    version: "1.0.0",
    meta: {
      id: editorDoc._id || editorDoc.id || generateId(),
      title: editorDoc.title || 'Untitled',
      createdAt: editorDoc.created_at || now,
      updatedAt: now,
      authorId: editorDoc.user_id || '',
      plan: userPlan || 'free',
      rank: 'cirak',
      xp: 0,
      sp: 0,
      wordCount: totalWords,
      pageCount: pages.length,
      language: 'tr',
    },
    settings: {
      pageSize: pageSize?.name || 'A4',
      pageColor: pageBackground || '#ffffff',
      gradientEnabled: false,
      watermark: editorDoc.watermark ? {
        text: editorDoc.watermark.text,
        opacity: editorDoc.watermark.opacity || 20,
        position: 'diagonal',
        color: '#999999',
      } : undefined,
    },
    pages,
    blackBand: blackBandBlockIds.length > 0 ? {
      enabled: true,
      encrypted: false,
      algorithm: 'AES-GCM',
      iv: '',
      data: '',
      blockIds: blackBandBlockIds,
    } : undefined,
    assets: { images: imageAssets },
    zeta: { history: [] },
    judge: { analysisHistory: [] },
  };
}

// --- CONVERTER: MS Format -> Editor Document ---
export function convertFromMSFormat(msDoc) {
  const pages = (msDoc.pages || []).map((page, idx) => {
    const elements = (page.blocks || []).map((block) => {
      const el = {
        id: block.id,
        type: block.type === 'paragraph' || block.type === 'heading' ? 'text' : block.type === 'image' ? 'image' : block.type,
        x: 60,
        y: 50 + (page.blocks.indexOf(block)) * 40,
        content: (block.content || '').replace(/<[^>]*>/g, ''),
        htmlContent: block.content || '',
        fontSize: block.format?.fontSize || 12,
        fontFamily: block.format?.fontFamily || 'Georgia',
        color: block.format?.color || '#000000',
        bold: block.format?.fontWeight === 'bold',
        italic: block.format?.italic || false,
        underline: block.format?.underline || false,
        strikethrough: block.format?.strikethrough || false,
        textAlign: block.format?.alignment || 'left',
        lineHeight: block.format?.lineHeight || 1.5,
        highlightColor: block.format?.backgroundColor || undefined,
        paddingLeft: block.format?.indent || 0,
      };
      if (block.type === 'image' && block.format?.assetId) {
        const asset = msDoc.assets?.images?.find(a => a.id === block.format.assetId);
        if (asset) {
          el.type = 'image';
          el.src = asset.data.startsWith('data:') ? asset.data : `data:${asset.mimeType};base64,${asset.data}`;
          el.width = block.format.width || asset.width || 200;
          el.height = block.format.height || asset.height || 200;
        }
      }
      if (block.format?.width) el.width = block.format.width;
      return el;
    });
    return {
      page_id: page.id || `page_${Date.now()}_${idx}`,
      elements,
      drawPaths: [],
    };
  });

  return {
    title: msDoc.meta?.title || 'Imported Document',
    pages,
    watermark: msDoc.settings?.watermark ? {
      text: msDoc.settings.watermark.text,
      opacity: msDoc.settings.watermark.opacity,
    } : undefined,
  };
}

// --- FILE I/O ---
export function exportToMSFile(msDoc, filename) {
  const serialized = serializeMS(msDoc);
  const blob = new Blob([serialized], { type: "application/zet-mindshare" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = `${filename || msDoc.meta?.title || "belge"}.ms`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromMSFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith(".ms")) {
      reject(new Error("Bu dosya bir .ms dosyasi degil."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        const doc = deserializeMS(content);
        resolve(doc);
      } catch (err) {
        reject(new Error("Dosya acilamadi -- bozuk veya gecersiz .ms formati."));
      }
    };
    reader.onerror = () => reject(new Error("Dosya okunamadi."));
    reader.readAsText(file);
  });
}

// --- CREATE EMPTY ---
export function createEmptyDocument(title, plan, authorId) {
  const now = new Date().toISOString();
  const pageId = generateId();
  const blockId = generateId();
  return {
    version: "1.0.0",
    meta: {
      id: generateId(),
      title,
      createdAt: now,
      updatedAt: now,
      authorId,
      plan: plan || 'free',
      rank: "cirak",
      xp: 0,
      sp: 0,
      wordCount: 0,
      pageCount: 1,
      language: "tr",
    },
    settings: {
      pageSize: "A4",
      pageColor: "#ffffff",
      gradientEnabled: false,
    },
    pages: [
      {
        id: pageId,
        index: 0,
        blocks: [
          {
            id: blockId,
            type: "paragraph",
            content: "",
            format: {
              fontSize: 12,
              fontFamily: "Georgia",
              alignment: "left",
              lineHeight: 1.6,
            },
          },
        ],
      },
    ],
    assets: { images: [] },
    zeta: { history: [] },
    judge: { analysisHistory: [] },
  };
}
