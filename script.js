// ==========================================
// 1. DATA SECTION (Gallery aur Events ki details yaha badle)
// ==========================================

const clubData = {
  // Impact Stats
  stats: {
    events: 10,
    members: 60,
    projects: 5,
  },

  // Gallery Images (Ek line mein slide hongi)
  gallery: [
    { url: "management.png", caption: "Forum Incharge" },
    { url: "lead.png", caption: "Lead" },
    { url: "Co-lead.png", caption: "Co-Leads" },
    { url: "App dev.png", caption: "App-dev Team" },
    { url: "web-dev 1.png", caption: "Web-Dev Team" },
    { url: "web-dev2.png", caption: "Web-Dev Team" },
  ],


};

// ==========================================
// 2. INITIALIZATION (Jab page load hoga tab yeh chalega)
// ==========================================
async function initSite() {
  // A. STATS UPDATE
  const sEvents = document.getElementById("stat-events");
  const sMembers = document.getElementById("stat-members");
  const sProjects = document.getElementById("stat-projects");

  if (sEvents) sEvents.innerText = clubData.stats.events + "+";
  if (sMembers) sMembers.innerText = clubData.stats.members + "+";
  if (sProjects) sProjects.innerText = clubData.stats.projects + "+";

  // B. GALLERY SLIDER POPULATE
  const photoGrid = document.getElementById("photo-grid");
  if (photoGrid) {
    photoGrid.innerHTML = clubData.gallery
      .map(
        (p) => `
            <div class="gallery-item relative group h-80 overflow-hidden rounded-[2.5rem] bento-card border-none shadow-md">

<img src="${resolveImagePath(p.url)}" class="w-full h-full object-cover object-center transform origin-center group-hover:scale-110 transition duration-500">
                <div class="absolute inset-0 img-overlay flex items-end p-8 opacity-0 group-hover:opacity-100 transition duration-300">
                    <p class="text-white font-bold text-lg">${p.caption}</p>
                </div>
            </div>
        `
      )
      .join("");
  }

  // C. EVENTS SLIDER POPULATE
  const eventGrid = document.getElementById("events-grid");
  if (eventGrid) {
    try {
      // 1. Get the list object from data/list.json
      const response = await fetch('data/list.json');
      const listObj = await response.json();
      const eventFolders = listObj.eventFolders || listObj;

      // 2. For each folder path (e.g., "event_a/details.json"), fetch that details.json
      const eventDataPromises = eventFolders.map(async (relPath) => {
        try {
          // relPath is like 'event_a/details.json'
          const res = await fetch(`data/${relPath}`);
          const details = await res.json();
          // compute the base directory for this event (e.g., 'event_a')
          const parts = relPath.split('/');
          const baseDir = parts.length > 1 ? parts.slice(0, -1).join('/') : parts[0];
          return { details, baseDir };
        } catch (err) {
          console.warn('Skipping event at', relPath, err);
          return null;
        }
      });

      const all = (await Promise.all(eventDataPromises)).filter(Boolean);

      // Helper to check if a URL exists (HEAD first, then GET fallback)
      async function urlExists(url) {
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (res && res.ok) return true;
        } catch (err) {
          // fallback to GET
        }
        try {
          const res2 = await fetch(url);
          return res2 && res2.ok;
        } catch (err) {
          return false;
        }
      }

      // Try to find thumbnail named 't' under data/<baseDir>/img/ or data/<baseDir>/images/ with common extensions
      async function findThumbFor(baseDir) {
        const exts = ['.svg', '.png', '.jpg', '.jpeg', '.webp', ''];
        for (const ex of exts) {
          const p1 = `data/${baseDir}/img/t${ex}`;
          if (await urlExists(p1)) return p1;
          const p2 = `data/${baseDir}/images/t${ex}`;
          if (await urlExists(p2)) return p2;
        }
        return null;
      }

      // Render each event after resolving its thumbnail (if any). If no thumbnail, use Material Symbols 'broken_image'.
      const htmlPromises = all.map(async ({ details: e, baseDir }) => {
        // status is a boolean: true = active/ongoing, absent or false = not active
        const isActive = Boolean(e.active);
        let statusBadge = '';
        if (isActive) {
          statusBadge = `<span class="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full">LIVE</span>`;
        }
        // prefer event-specified image if present
        const specified = e.img || e.image || null;
        let thumb = null;
        if (specified) {
          // check specified as absolute/public or relative inside event folder
          if (/^https?:\/\//.test(specified) || specified.startsWith('public/')) {
            thumb = specified;
          } else {
            // check relative to event folder
            const candidate = `data/${baseDir}/${specified}`;
            if (await urlExists(candidate)) thumb = candidate;
            else if (await urlExists(resolveImagePath(specified))) thumb = resolveImagePath(specified);
          }
        }
        // if not found yet, try the 't' thumbnails
        if (!thumb) {
          const found = await findThumbFor(baseDir);
          if (found) thumb = found;
        }

        if (thumb) {
          const imgSrc = resolveImagePath(thumb);
      return `
    <div class="event-card bento-card overflow-hidden rounded-[2rem] bg-white">
      <img src="${imgSrc}" class="w-full h-48 object-cover bg-gray-50" onerror="this.onerror=null;this.style.display='none'">
      <div class="p-8">
        <div class="flex items-center gap-3">
        <span class="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">${e.tag || ''}</span>
        ${statusBadge}
        </div>
        <h4 class="text-xl font-bold mt-4">${e.title || ''}</h4>
        <p class="text-slate-500 text-sm mt-2 mb-4">${e.date || ''}</p>
        <button onclick="window.open('${e.link || '#'}', '_blank')" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-100">View Details</button>
      </div>
    </div>
  `;
        }

        // no thumbnail: render broken_image using Google Material Symbols
        return `
      <div class="event-card bento-card overflow-hidden rounded-[2rem] bg-white">
          <div class="w-full h-48 bg-gray-50 flex items-center justify-center text-slate-400">
            <span class="material-symbols-outlined text-4xl">broken_image</span>
          </div>
          <div class="p-8">
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">${e.tag || ''}</span>
                ${statusBadge}
              </div>
              <h4 class="text-xl font-bold mt-4">${e.title || ''}</h4>
              <p class="text-slate-500 text-sm mt-2 mb-4">${e.date || ''}</p>
              <button onclick="window.open('${e.link || '#'}', '_blank')" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-100">View Details</button>
          </div>
      </div>
    `;
      });

      eventGrid.innerHTML = (await Promise.all(htmlPromises)).join('');

    } catch (error) {
      console.error("Error loading events:", error);
    }
  }
}

// Helper: if the path looks like a remote URL, return it unchanged; otherwise prefix with public/
function resolveImagePath(path) {
  if (!path) return '';
  const trimmed = String(path).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  // data URLs or event-local data/ paths should be returned as-is
  if (trimmed.startsWith('data:') || trimmed.startsWith('data/')) return trimmed;
  // blob or filesystem URLs should also be returned as-is
  if (trimmed.startsWith('blob:') || trimmed.startsWith('filesystem:')) return trimmed;
  // If path already contains 'public/', assume it's correct
  if (trimmed.startsWith('public/')) return trimmed;
  // Otherwise, look in public/ folder for the asset
  return `public/${trimmed}`;
}

window.onload = initSite;