import { db } from './firebase-config.js';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const linksContainer = document.getElementById('dynamic-links-container');
const fallbackLinks = document.getElementById('fallback-links');

// Buscar Links em Tempo Real
const q = query(collection(db, "linktree_links"), orderBy("order", "asc"));
onSnapshot(q, (snapshot) => {
    
    // Se o banco de dados estiver vazio, mostramos os links padrão do HTML (fallback)
    if (snapshot.empty) {
        if(fallbackLinks) fallbackLinks.classList.remove('hidden');
        if(linksContainer) linksContainer.innerHTML = '';
        return;
    }

    // Se temos links no banco, ocultamos o fallback estático
    if(fallbackLinks) fallbackLinks.classList.add('hidden');
    
    let htmlContent = '';
    
    snapshot.forEach((docSnap) => {
        const link = docSnap.data();
        
        let linkAttributes = `href="${link.url}" target="_blank"`;
        let modalClick = '';

        // Tratamento especial para abrir Modais
        if (link.url === '#modal-location') {
            linkAttributes = `href="#"`;
            modalClick = `onclick="openLocationModal(event)"`;
        } else if (link.url === '#modal-feedback') {
            linkAttributes = `href="#"`;
            modalClick = `onclick="openFeedbackModal(event)"`;
        }

        if (link.highlight) {
            htmlContent += `
                <a ${linkAttributes} ${modalClick} class="relative group block">
                    <div class="floating-badge">Novo!</div>
                    <div class="bg-gradient-to-br from-brand-400 to-brand-600 text-white rounded-2xl p-4 flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-soft border border-brand-300">
                        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <i class="ph ${link.icon} text-xl"></i>
                        </div>
                        <div class="flex-1 text-center">
                            <p class="font-bold text-lg leading-tight">${link.title}</p>
                            ${link.subtitle ? `<p class="text-xs text-white/90 font-medium">${link.subtitle}</p>` : ''}
                        </div>
                        <div class="w-10 flex justify-center"><i class="ph ph-caret-right text-lg opacity-80"></i></div>
                    </div>
                </a>
            `;
        } else {
            // Estilo Secundário (Branco)
            htmlContent += `
                <a ${linkAttributes} ${modalClick} class="bg-white border border-brand-100 rounded-2xl p-4 flex items-center justify-between group transition-all hover:border-brand-400 hover:shadow-soft hover:-translate-y-0.5">
                    <div class="w-10 h-10 rounded-full bg-brand-50 text-brand-500 border border-brand-100 group-hover:scale-110 transition-transform flex items-center justify-center flex-shrink-0">
                        <i class="ph ${link.icon} text-xl"></i>
                    </div>
                    <div class="flex-1 text-center">
                        <p class="font-bold text-gray-800 leading-tight">${link.title}</p>
                        ${link.subtitle ? `<p class="text-xs text-gray-500 font-medium">${link.subtitle}</p>` : ''}
                    </div>
                    <div class="w-10 flex justify-center"><i class="ph ph-caret-right text-gray-400 group-hover:text-brand-500 transition-colors"></i></div>
                </a>
            `;
        }
    });

    if(linksContainer) linksContainer.innerHTML = htmlContent;
});
