import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Elementos da UI
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');
const linksContainer = document.getElementById('links-container');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-links');

const modal = document.getElementById('link-modal');
const modalContent = document.getElementById('link-modal-content');
const linkForm = document.getElementById('link-form');
const btnAddNew = document.getElementById('btn-add-new');
const btnImportDefaults = document.getElementById('btn-import-defaults');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');

// Estado
let currentLinks = [];
let maxOrder = 0;

// Escutador de Autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        loadLinks();
    } else {
        loginScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('btn-login');
    
    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Entrando...';
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.classList.remove('hidden');
        console.error(error);
    } finally {
        btn.innerHTML = '<span>Entrar</span><i class="ph-bold ph-sign-in"></i>';
        btn.disabled = false;
    }
});

// Logout
btnLogout.addEventListener('click', () => {
    signOut(auth);
});

// Buscar Links em Tempo Real
function loadLinks() {
    const q = query(collection(db, "linktree_links"), orderBy("order", "asc"));
    onSnapshot(q, (snapshot) => {
        currentLinks = [];
        loadingState.classList.add('hidden');
        
        if (snapshot.empty) {
            emptyState.classList.remove('hidden');
            linksContainer.classList.add('hidden');
            maxOrder = 0;
            return;
        }

        emptyState.classList.add('hidden');
        linksContainer.classList.remove('hidden');
        linksContainer.innerHTML = '';
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            currentLinks.push({ id: docSnap.id, ...data });
            if(data.order > maxOrder) maxOrder = data.order;
        });

        renderLinks();
    }, (error) => {
        console.error("Erro no Firebase:", error);
        loadingState.classList.add('hidden');
        emptyState.innerHTML = `<span class="text-red-500">Erro de Permissão:</span><br>Vá no Firebase Console > Firestore Database > Rules, e altere para:<br><code class="bg-gray-100 p-2 block mt-2 text-xs text-left">rules_version = '2';<br>service cloud.firestore {<br>&nbsp;&nbsp;match /databases/{database}/documents {<br>&nbsp;&nbsp;&nbsp;&nbsp;match /{document=**} {<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read: if true;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow write: if request.auth != null;<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;}<br>}</code>`;
        emptyState.classList.remove('hidden');
    });
}

// Renderizar Links no Dashboard
function renderLinks() {
    linksContainer.innerHTML = '';
    currentLinks.forEach((link, index) => {
        const div = document.createElement('div');
        div.className = "bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-4";
        
        const isFirst = index === 0;
        const isLast = index === currentLinks.length - 1;
        const isImage = link.style === 'image-card' && link.imageBase64;
        const iconContent = isImage 
            ? `<img src="${link.imageBase64}" class="w-full h-full object-cover rounded-xl">` 
            : `<i class="ph ${link.icon || 'ph-link'} text-2xl"></i>`;

        div.innerHTML = `
            <div class="flex items-center gap-4 flex-1 overflow-hidden">
                <div class="w-12 h-12 rounded-xl ${isImage ? '' : 'bg-gray-50'} flex items-center justify-center flex-shrink-0 text-gray-500 border border-gray-100">
                    ${iconContent}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-gray-800 truncate">${link.title}</p>
                    <p class="text-xs text-gray-500 truncate">${link.subtitle || link.url}</p>
                </div>
            </div>
            
            <div class="flex items-center gap-1 sm:gap-2">
                <div class="flex flex-col gap-1 mr-2">
                    <button onclick="moveUp('${link.id}', ${index})" class="text-gray-400 hover:text-brand-500 disabled:opacity-30 disabled:hover:text-gray-400" ${isFirst ? 'disabled' : ''}>
                        <i class="ph-bold ph-caret-up"></i>
                    </button>
                    <button onclick="moveDown('${link.id}', ${index})" class="text-gray-400 hover:text-brand-500 disabled:opacity-30 disabled:hover:text-gray-400" ${isLast ? 'disabled' : ''}>
                        <i class="ph-bold ph-caret-down"></i>
                    </button>
                </div>
                <button onclick="editLink('${link.id}')" class="w-10 h-10 rounded-lg hover:bg-brand-50 text-gray-500 hover:text-brand-500 transition-colors flex items-center justify-center">
                    <i class="ph-bold ph-pencil-simple text-lg"></i>
                </button>
                <button onclick="deleteLink('${link.id}')" class="w-10 h-10 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors flex items-center justify-center">
                    <i class="ph-bold ph-trash text-lg"></i>
                </button>
            </div>
        `;
        linksContainer.appendChild(div);
    });
}

// Selectors extras do Modal
const actionTypeSelect = document.getElementById('link-action-type');
const visualStyleSelect = document.getElementById('link-visual-style');
const urlContainer = document.getElementById('url-container');
const iconContainer = document.getElementById('icon-container');
const imageUploadContainer = document.getElementById('image-upload-container');
const imageFile = document.getElementById('link-image-file');
const imagePreviewBox = document.getElementById('image-preview-box');
const galleryUploadContainer = document.getElementById('gallery-upload-container');
const galleryFiles = document.getElementById('link-gallery-files');
const galleryPreviewGrid = document.getElementById('gallery-preview-grid');

let currentImageBase64 = null;
let currentGalleryBase64 = [];

function updateModalFieldsVisibility() {
    const action = actionTypeSelect.value;
    const style = visualStyleSelect.value;
    
    // Controlar visibilidade da URL
    if (action === 'url') {
        urlContainer.classList.remove('hidden');
    } else {
        urlContainer.classList.add('hidden');
    }
    
    // Controlar visibilidade de Icone vs Imagem
    if (style === 'image-card') {
        iconContainer.classList.add('hidden');
        imageUploadContainer.classList.remove('hidden');
        galleryUploadContainer.classList.add('hidden');
    } else if (style === 'image-gallery') {
        iconContainer.classList.add('hidden');
        imageUploadContainer.classList.add('hidden');
        galleryUploadContainer.classList.remove('hidden');
    } else {
        iconContainer.classList.remove('hidden');
        imageUploadContainer.classList.add('hidden');
        galleryUploadContainer.classList.add('hidden');
    }
}

actionTypeSelect.addEventListener('change', updateModalFieldsVisibility);
visualStyleSelect.addEventListener('change', updateModalFieldsVisibility);

// Lógica de Compressão de Imagem (Base64)
imageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Comprime em JPEG com 80% de qualidade
            currentImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            imagePreviewBox.innerHTML = `<img src="${currentImageBase64}" class="w-full h-full object-cover rounded-xl">`;
        };
    };
});

// Lógica para Múltiplas Imagens (Galeria)
galleryFiles.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files).slice(0, 15); // Máximo 15 imagens
    if (files.length === 0) return;
    
    // Mostra loading no botão de salvar para evitar salvar antes de comprimir
    document.getElementById('btn-save-link').disabled = true;
    galleryPreviewGrid.innerHTML = '<p class="col-span-4 text-sm text-gray-500">Comprimindo imagens...</p>';
    
    currentGalleryBase64 = [];
    
    for (let file of files) {
        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; // Um pouco maior para galerias
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    currentGalleryBase64.push(canvas.toDataURL('image/jpeg', 0.8));
                    resolve();
                };
            };
        });
    }
    
    renderGalleryPreview();
    document.getElementById('btn-save-link').disabled = false;
});

function renderGalleryPreview() {
    galleryPreviewGrid.innerHTML = '';
    currentGalleryBase64.forEach((base64) => {
        galleryPreviewGrid.innerHTML += `
            <div class="aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src="${base64}" class="w-full h-full object-cover">
            </div>
        `;
    });
}

function openModal(link = null) {
    if (link) {
        document.getElementById('modal-title').innerText = "Editar Link";
        document.getElementById('link-id').value = link.id;
        document.getElementById('link-title').value = link.title;
        document.getElementById('link-subtitle').value = link.subtitle || '';
        document.getElementById('link-icon').value = link.icon || 'ph-link';
        
        // Carregar selects
        actionTypeSelect.value = link.actionType || (link.url.startsWith('#modal') ? link.url.replace('#', '') : 'url');
        visualStyleSelect.value = link.style || (link.highlight ? 'highlight' : 'standard');
        
        // Se for modal, pode deixar a URL normal ou preenchida. Se for link normal, carrega.
        document.getElementById('link-url').value = (actionTypeSelect.value === 'url') ? link.url : '';
        
        currentImageBase64 = link.imageBase64 || null;
        if (currentImageBase64) {
            imagePreviewBox.innerHTML = `<img src="${currentImageBase64}" class="w-full h-full object-cover rounded-xl">`;
        } else {
            imagePreviewBox.innerHTML = `<i class="ph-bold ph-image text-gray-400 text-2xl"></i>`;
        }
        
        currentGalleryBase64 = link.galleryBase64 || [];
        renderGalleryPreview();
        
        updateIconPreview();
    } else {
        document.getElementById('modal-title').innerText = "Adicionar Novo Link";
        linkForm.reset();
        document.getElementById('link-id').value = '';
        document.getElementById('link-icon').value = 'ph-link';
        actionTypeSelect.value = 'url';
        visualStyleSelect.value = 'standard';
        currentImageBase64 = null;
        imagePreviewBox.innerHTML = `<i class="ph-bold ph-image text-gray-400 text-2xl"></i>`;
        currentGalleryBase64 = [];
        renderGalleryPreview();
        updateIconPreview();
    }
    
    updateModalFieldsVisibility();
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
}

function closeModal() {
    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

btnAddNew.addEventListener('click', () => openModal());
btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);

// Importar links padrões
const defaultLinks = [
    { title: 'Compre na Shopee', subtitle: 'Aproveite Cupons de Frete', url: 'https://br.shp.ee/FLxK9z9g', icon: 'ph-shopping-bag', actionType: 'url', style: 'shopee' },
    { title: 'Atendimento VIP', subtitle: 'Fale direto no WhatsApp', url: 'https://wa.me/5534998882385', icon: 'ph-whatsapp-logo', actionType: 'url', style: 'whatsapp' },
    { title: 'Nossas Clientes (Mães que Amam)', subtitle: 'Participe do nosso Grupo Secreto VIP', url: 'https://chat.whatsapp.com/DCLpzt7k4zlH2sPkBTXaNM?s=cl&p=a&mlu=3', icon: 'ph-star', actionType: 'url', style: 'standard' },
    { title: 'Nossa Localização', subtitle: 'Conceição das Alagoas - MG', url: '#modal-location', icon: 'ph-map-pin', actionType: 'modal-location', style: 'standard' },
    { title: 'Acesse nosso catálogo', subtitle: 'Veja todos os modelos disponíveis', url: 'https://www.whatsapp.com/catalog/553498882385/?app_absent=0', icon: 'ph-storefront', actionType: 'url', style: 'standard' },
    { title: 'Informações de Envio', subtitle: 'Prazos, frete e rastreamento', url: 'https://wa.me/5534998882385', icon: 'ph-truck', actionType: 'url', style: 'standard' },
    { title: 'O que as clientes dizem', subtitle: 'Avaliações de mamães reais', url: '#modal-feedback', icon: 'ph-chat-centered-text', actionType: 'modal-feedback', style: 'standard' }
];

btnImportDefaults.addEventListener('click', async () => {
    if(!confirm("Deseja importar os 5 links originais para o seu painel?")) return;
    
    btnImportDefaults.disabled = true;
    btnImportDefaults.innerHTML = '<i class="ph ph-spinner animate-spin"></i> ...';
    
    try {
        let currentOrder = maxOrder;
        for(const link of defaultLinks) {
            currentOrder++;
            link.order = currentOrder;
            await addDoc(collection(db, "linktree_links"), link);
        }
    } catch(e) {
        console.error(e);
        alert("Erro ao importar links.");
    } finally {
        btnImportDefaults.disabled = false;
        btnImportDefaults.innerHTML = '<i class="ph-bold ph-download-simple"></i> Links Originais';
    }
});

document.getElementById('link-icon').addEventListener('input', updateIconPreview);
function updateIconPreview() {
    const iconClass = document.getElementById('link-icon').value;
    document.getElementById('icon-preview').className = `ph-bold ${iconClass} text-xl`;
}

// Salvar (Add ou Update)
linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-link');
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Salvando...';

    const id = document.getElementById('link-id').value;
    const action = actionTypeSelect.value;
    const style = visualStyleSelect.value;
    
    let finalUrl = '';
    if (action === 'modal-location') finalUrl = '#modal-location';
    else if (action === 'modal-feedback') finalUrl = '#modal-feedback';
    else finalUrl = document.getElementById('link-url').value;

    const data = {
        title: document.getElementById('link-title').value,
        subtitle: document.getElementById('link-subtitle').value,
        url: finalUrl,
        icon: document.getElementById('link-icon').value,
        actionType: action,
        style: style,
        imageBase64: style === 'image-card' ? currentImageBase64 : null,
        galleryBase64: style === 'image-gallery' ? currentGalleryBase64 : null
    };

    try {
        if (id) {
            await updateDoc(doc(db, "linktree_links", id), data);
        } else {
            data.order = maxOrder + 1;
            await addDoc(collection(db, "linktree_links"), data);
        }
        closeModal();
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar o link. Tente novamente.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph-bold ph-check"></i> Salvar';
    }
});

// Delete
window.deleteLink = async (id) => {
    if (confirm("Tem certeza que deseja excluir este link?")) {
        await deleteDoc(doc(db, "linktree_links", id));
    }
};

// Edit
window.editLink = (id) => {
    const link = currentLinks.find(l => l.id === id);
    if (link) openModal(link);
};

// Move Up
window.moveUp = async (id, index) => {
    if (index === 0) return;
    const prevLink = currentLinks[index - 1];
    const currentLink = currentLinks[index];
    
    // Swap order
    await updateDoc(doc(db, "linktree_links", currentLink.id), { order: prevLink.order });
    await updateDoc(doc(db, "linktree_links", prevLink.id), { order: currentLink.order });
};

// Move Down
window.moveDown = async (id, index) => {
    if (index === currentLinks.length - 1) return;
    const nextLink = currentLinks[index + 1];
    const currentLink = currentLinks[index];
    
    // Swap order
    await updateDoc(doc(db, "linktree_links", currentLink.id), { order: nextLink.order });
    await updateDoc(doc(db, "linktree_links", nextLink.id), { order: currentLink.order });
};

// Mapear globalmente para onclick no HTML
window.openModal = openModal;
window.closeModal = closeModal;
