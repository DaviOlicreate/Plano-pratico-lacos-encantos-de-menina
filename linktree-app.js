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

        // Backward compatibility and actionType support
        const isModalLocation = link.actionType === 'modal-location' || link.url === '#modal-location';
        const isModalFeedback = link.actionType === 'modal-feedback' || link.url === '#modal-feedback';

        if (isModalLocation) {
            linkAttributes = `href="#"`;
            modalClick = `onclick="openLocationModal(event)"`;
        } else if (isModalFeedback) {
            linkAttributes = `href="#"`;
            modalClick = `onclick="openFeedbackModal(event)"`;
        }

        const style = link.style || (link.highlight ? 'highlight' : 'standard');

        if (style === 'highlight') {
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
        } else if (style === 'shopee') {
            htmlContent += `
                <a ${linkAttributes} ${modalClick} class="relative group block">
                    <div class="floating-badge">Mais rápido e seguro!</div>
                    <div class="btn-shopee text-white rounded-2xl p-4 flex items-center justify-between transition-all">
                        <div class="icon-circle bg-white/20 flex-shrink-0">
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
        } else if (style === 'whatsapp') {
            htmlContent += `
                <a ${linkAttributes} ${modalClick} class="block relative group">
                    <div class="bg-brand-whatsapp text-white rounded-2xl p-4 flex items-center justify-between shadow-soft hover:-translate-y-0.5 hover:shadow-lg transition-all border border-green-400/30">
                        <div class="icon-circle bg-white/20 flex-shrink-0">
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
        } else if (style === 'image-card') {
            htmlContent += `
                <a ${linkAttributes} ${modalClick} class="block bg-white rounded-2xl overflow-hidden shadow-soft border border-brand-100 group transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <div class="w-full h-48 bg-gray-100 relative">
                        ${link.imageBase64 ? `<img src="${link.imageBase64}" class="w-full h-full object-cover" alt="${link.title}">` : '<div class="w-full h-full flex items-center justify-center text-gray-400"><i class="ph ph-image text-3xl"></i></div>'}
                        <div class="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
                    </div>
                    <div class="p-4 flex items-center justify-between bg-white relative z-10">
                        <div class="flex-1">
                            <p class="font-bold text-gray-800 leading-tight">${link.title}</p>
                            ${link.subtitle ? `<p class="text-xs text-gray-500 font-medium mt-1">${link.subtitle}</p>` : ''}
                        </div>
                        <div class="w-10 flex justify-end"><i class="ph ph-caret-right text-brand-500 opacity-80 group-hover:translate-x-1 transition-transform"></i></div>
                    </div>
                </a>
            `;
        } else {
            // Estilo Secundário (Branco/Padrão)
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
}, (error) => {
    console.error("Erro no Firebase:", error);
    if(fallbackLinks) fallbackLinks.classList.remove('hidden');
    if(linksContainer) linksContainer.innerHTML = '';
});
