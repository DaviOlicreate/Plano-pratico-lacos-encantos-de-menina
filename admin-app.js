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

        div.innerHTML = `
            <div class="flex items-center gap-4 flex-1 overflow-hidden">
                <div class="w-12 h-12 rounded-lg ${link.highlight ? 'bg-brand-50 text-brand-500 border border-brand-100' : 'bg-gray-50 text-gray-500 border border-gray-100'} flex items-center justify-center flex-shrink-0">
                    <i class="ph-fill ${link.icon} text-2xl"></i>
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

// Modal Logic
function openModal(link = null) {
    if (link) {
        document.getElementById('modal-title').innerText = "Editar Link";
        document.getElementById('link-id').value = link.id;
        document.getElementById('link-title').value = link.title;
        document.getElementById('link-subtitle').value = link.subtitle || '';
        document.getElementById('link-url').value = link.url;
        document.getElementById('link-icon').value = link.icon;
        document.getElementById('link-highlight').checked = link.highlight || false;
        updateIconPreview();
    } else {
        document.getElementById('modal-title').innerText = "Adicionar Novo Link";
        linkForm.reset();
        document.getElementById('link-id').value = '';
        document.getElementById('link-icon').value = 'ph-link';
        updateIconPreview();
    }
    
    modal.classList.remove('hidden');
    // Allow small delay for display block to apply before transition
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
    const data = {
        title: document.getElementById('link-title').value,
        subtitle: document.getElementById('link-subtitle').value,
        url: document.getElementById('link-url').value,
        icon: document.getElementById('link-icon').value,
        highlight: document.getElementById('link-highlight').checked,
    };

    try {
        if (id) {
            // Update
            await updateDoc(doc(db, "linktree_links", id), data);
        } else {
            // Create
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
