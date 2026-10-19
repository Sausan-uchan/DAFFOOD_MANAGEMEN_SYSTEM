// TUGAS BAB 4 - Promise meniru jeda respons server karena aplikasi belum memakai backend.
window.DAFFOOD = Object.freeze({
    wait: (duration = 300) => new Promise((resolve) => window.setTimeout(resolve, duration))
});

// TUGAS BAB 4 - Popup Box confirm mengonfirmasi aksi keluar di seluruh halaman.
document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest('a[data-confirm]');
    if (!link) return;

    if (!window.confirm(link.dataset.confirm)) {
        event.preventDefault();
        return;
    }

    if (link.dataset.clearSession === 'true') {
        try {
            localStorage.removeItem('daffood-session');
        } catch (error) {
            event.preventDefault();
            window.alert('Sesi tidak dapat dihapus dari penyimpanan browser.');
        }
    }
});
