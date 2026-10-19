# DAFFOOD - Sistem Manajemen Restoran

## TUGAS BAB 4

Project Sistem Manajemen DAFFOOD menerapkan Popup Box, event, manipulasi DOM,
Web Storage, serta asynchronous dan Promise. Potongan kode di bawah merangkum
implementasi yang ditambahkan pada project dan disediakan agar mudah disalin
ke laporan. Potongan merupakan bagian dari skrip halaman terkait; beberapa
contoh memakai variabel dan fungsi yang sudah dideklarasikan sebelumnya pada
halaman yang sama.

> Login dan registrasi merupakan simulasi frontend. Data hanya tersimpan di
> browser dan tidak ada autentikasi server. Kata sandi tidak disimpan.

## 1. Popup Box

### Konfirmasi sebelum keluar

Skrip berikut berada di `js/common.js` dan dipakai bersama pada halaman sistem.
Popup `confirm` meminta persetujuan sebelum sesi dihapus dan pengguna diarahkan
ke halaman login.

```javascript
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
```

Elemen tautan keluar pada `dashboard.html`:

```html
<!-- TUGAS BAB 4 - Atribut data-confirm mengaktifkan popup konfirmasi sebelum logout. -->
<a class="logout-link"
   href="login.html"
   data-confirm="Apakah Anda yakin ingin keluar dari DAFFOOD?"
   data-clear-session="true">
    Keluar
</a>
```

### Konfirmasi sebelum menghapus menu atau pesanan

```javascript
// TUGAS BAB 4 - Popup Box confirm mencegah data terhapus tanpa persetujuan.
if (!window.confirm(`Apakah Anda yakin ingin menghapus ${label}?`)) return;

if (type === 'menu') {
    menuItems = menuItems.filter((item) => item.id !== id);
} else {
    const transaction = transactions.find((item) => item.id === id);
    const menu = transaction?.stockDeducted ? menuById(transaction.menuId) : null;
    if (menu) menu.stock += transaction.quantity;
    transactions = transactions.filter((item) => item.id !== id);
}
```

### Popup catatan laporan

Tombol dan area catatan laporan pada `dashboard.html`:

```html
<!-- TUGAS BAB 4 - Tombol membuka Popup Box untuk mencatat informasi laporan penjualan. -->
<button class="outline-button" id="report-note-button" type="button">
    Tambah catatan laporan
</button>
<p class="intro-copy" id="report-note" aria-live="polite"></p>
```

Popup `prompt` digunakan untuk memasukkan catatan laporan, sedangkan `alert`
memberi tahu pengguna apabila catatan kosong atau gagal disimpan.

```javascript
// TUGAS BAB 4 - Popup Box prompt meminta catatan laporan dan alert memberi umpan balik.
document.getElementById('report-note-button').addEventListener('click', () => {
    const note = window.prompt(
        'Masukkan catatan untuk laporan penjualan DAFFOOD:',
        reportNote
    );
    if (note === null) return;

    if (!note.trim()) {
        window.alert('Catatan laporan tidak boleh kosong.');
        return;
    }

    try {
        reportNote = note.trim();
        localStorage.setItem('daffood-report-note', reportNote);
        document.getElementById('report-note').textContent = `Catatan: ${reportNote}`;
        showToast('Catatan laporan berhasil disimpan.');
    } catch (error) {
        window.alert('Catatan laporan gagal disimpan ke browser.');
    }
});
```

## 2. Event dan Manipulasi DOM

Event yang diterapkan antara lain `click`, `input`, `change`, `submit`,
`hashchange`, `mouseenter`, dan `mouseleave`. Contoh event pencarian, filter,
dan navigasi dashboard:

```javascript
// TUGAS BAB 4 - Event input memfilter data menu dan pesanan langsung di DOM.
document.getElementById('menu-search').addEventListener('input', renderDashboard);
document.getElementById('transaction-search').addEventListener('input', renderDashboard);

// TUGAS BAB 4 - Event change menerapkan filter status pesanan.
document.getElementById('transaction-status-filter')
    .addEventListener('change', renderDashboard);

// TUGAS BAB 4 - Event hashchange menyelaraskan halaman aktif dengan navigasi dashboard.
window.addEventListener('hashchange', () => {
    activateDashboardView(window.location.hash.slice(1) || 'overview');
});
```

Contoh manipulasi DOM saat menampilkan data menu:

```javascript
// TUGAS BAB 4 - DOM membangun ulang baris tabel menu sesuai hasil pencarian.
const menuFiltered = menuItems.filter((item) =>
    `${item.name} ${item.category}`.toLocaleLowerCase('id').includes(menuQuery)
);
document.getElementById('menu-rows').innerHTML = menuFiltered.length
    ? menuFiltered.map((item) =>
        `<tr>
            <td><span class="item-name">${escapeHtml(item.name)}</span></td>
            <td>${escapeHtml(item.category)}</td>
            <td class="price-cell">${rupiah(item.price)}</td>
            <td>${item.stock} porsi</td>
            <td>${item.stock > 0 ? 'Tersedia' : 'Habis'}</td>
            <td>${actionButtons('menu', item.id)}</td>
        </tr>`
    ).join('')
    : '<tr><td colspan="6">Menu tidak ditemukan.</td></tr>';
```

Contoh event delegation untuk tombol edit dan hapus yang dibuat bersama baris
tabel dinamis:

```javascript
// TUGAS BAB 4 - Event delegation menangani tombol pada baris tabel yang dibuat dinamis.
document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const editButton = target.closest('[data-edit]');
    const deleteButton = target.closest('[data-delete]');

    if (editButton) {
        openDialog(editButton.dataset.edit, editButton.dataset.id);
    } else if (deleteButton) {
        const { delete: type, id } = deleteButton.dataset;
        const label = type === 'menu' ? menuById(id)?.name : `pesanan #${id}`;
        if (!window.confirm(`Apakah Anda yakin ingin menghapus ${label}?`)) return;

        const previousMenuItems = JSON.parse(JSON.stringify(menuItems));
        const previousTransactions = JSON.parse(JSON.stringify(transactions));
        if (type === 'menu') {
            menuItems = menuItems.filter((item) => item.id !== id);
        } else {
            const transaction = transactions.find((item) => item.id === id);
            const menu = transaction?.stockDeducted ? menuById(transaction.menuId) : null;
            if (menu) menu.stock += transaction.quantity;
            transactions = transactions.filter((item) => item.id !== id);
        }

        try {
            persist();
        } catch (error) {
            menuItems = previousMenuItems;
            transactions = previousTransactions;
            renderDashboard();
            showToast('Data gagal disimpan ke penyimpanan browser.', 'error');
            return;
        }
        renderDashboard();
        showToast('Data berhasil dihapus.');
    }
});
```

## 3. Web Storage

Data menu dan pesanan disimpan agar tetap tersedia saat dashboard dibuka kembali.
Profil login dan preferensi tampilan juga memakai `localStorage`.

```javascript
// TUGAS BAB 4 - Web Storage menyimpan menu dan pesanan di browser.
const persist = () => {
    localStorage.setItem('daffood-menu', JSON.stringify(menuItems));
    localStorage.setItem('daffood-transactions', JSON.stringify(transactions));
};

// TUGAS BAB 4 - Web Storage memuat data tersimpan atau menggunakan data awal.
const readData = (key, fallback) => {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
        return fallback;
    }
};
```

Preferensi tema dan warna dashboard juga disimpan secara terpisah. Pada kode
project, setiap penyimpanan dibungkus `try...catch` agar kegagalan dapat
ditampilkan melalui notifikasi:

```javascript
// TUGAS BAB 4 - Event click mengganti dan menyimpan pilihan mode tampilan.
themeToggle.addEventListener('click', () => {
    currentMode = currentMode === 'dark' ? 'light' : 'dark';
    applyAppearance(currentMode, currentColorTheme);
    try {
        localStorage.setItem('daffood-theme-mode', currentMode);
    } catch (error) {
        showToast('Preferensi tema tidak dapat disimpan.', 'error');
    }
});

// TUGAS BAB 4 - Event change mengganti dan menyimpan pilihan warna dashboard.
colorTheme.addEventListener('change', () => {
    currentColorTheme = colorTheme.value;
    document.body.dataset.colorTheme = currentColorTheme;
    try {
        localStorage.setItem('daffood-color-theme', currentColorTheme);
    } catch (error) {
        showToast('Preferensi warna tidak dapat disimpan.', 'error');
    }
});
```

## 4. Asynchronous dan Promise

Helper Promise bersama di `js/common.js` mensimulasikan waktu tunggu respons
server. Tidak ada request ke backend.

```javascript
// TUGAS BAB 4 - Promise meniru jeda respons server karena aplikasi belum memakai backend.
window.DAFFOOD = Object.freeze({
    wait: (duration = 300) =>
        new Promise((resolve) => window.setTimeout(resolve, duration))
});
```

Contoh event asynchronous pada formulir login:

```javascript
// TUGAS BAB 4 - async/await memproses login demo dan menyimpan sesi ke Web Storage.
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = loginForm.querySelector('[type="submit"]');
    submitButton.disabled = true;

    try {
        await DAFFOOD.wait();
        const email = document.getElementById('login-email').value.trim();
        const registeredUser = JSON.parse(
            localStorage.getItem('daffood-user') || 'null'
        );
        const name = registeredUser?.email === email
            ? registeredUser.name
            : 'Administrator';

        localStorage.setItem('daffood-session', JSON.stringify({
            email,
            name,
            signedInAt: new Date().toISOString()
        }));
        showLoginToast('Selamat, login berhasil. Mengalihkan ke dashboard...');
        setTimeout(() => {
            window.location.href = `${loginForm.action}?toast=login`;
        }, 1200);
    } catch (error) {
        showLoginToast('Sesi gagal disimpan. Periksa izin penyimpanan browser.');
        submitButton.disabled = false;
    }
});
```

Formulir registrasi menggunakan prinsip yang sama untuk menyimpan profil
non-rahasia. Kata sandi tidak dimasukkan ke Web Storage:

```javascript
// TUGAS BAB 4 - Registrasi memakai async/Promise dan hanya menyimpan profil non-rahasia.
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = registerForm.querySelector('[type="submit"]');
    submitButton.disabled = true;

    try {
        await DAFFOOD.wait();
        const values = new FormData(registerForm);
        localStorage.setItem('daffood-user', JSON.stringify({
            name: values.get('name').trim(),
            email: values.get('email').trim()
        }));
        showRegisterToast('Pendaftaran berhasil. Mengalihkan ke login...');
        setTimeout(() => {
            window.location.href = `${registerForm.action}?toast=register`;
        }, 900);
    } catch (error) {
        showRegisterToast('Data akun gagal disimpan. Periksa izin penyimpanan browser.');
        submitButton.disabled = false;
    }
});
```

Penyimpanan data menu dan pesanan pada dashboard juga berjalan asynchronous.
Sebelum operasi dilakukan, data lama disalin agar dapat dipulihkan apabila
penyimpanan browser gagal:

```javascript
// TUGAS BAB 4 - Event submit menyimpan perubahan menu/pesanan setelah proses Promise.
document.getElementById('data-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = event.currentTarget.querySelector('[type="submit"]');
    submitButton.disabled = true;
    await DAFFOOD.wait(200);

    const previousMenuItems = JSON.parse(JSON.stringify(menuItems));
    const previousTransactions = JSON.parse(JSON.stringify(transactions));
    const values = Object.fromEntries(new FormData(event.currentTarget));

    if (activeType === 'menu') {
        const record = {
            id: editingId || `menu-${Date.now()}`,
            name: values.name.trim(),
            category: values.category.trim(),
            price: Number(values.price),
            stock: Number(values.stock)
        };
        if (editingId) {
            menuItems = menuItems.map((item) => item.id === editingId ? record : item);
        } else {
            menuItems.unshift(record);
        }
    } else {
        const existing = editingId
            ? transactions.find((item) => item.id === editingId)
            : null;
        const selectedMenu = menuById(values.menuId);
        const existingMenu = existing ? menuById(existing.menuId) : null;
        const returnedQuantity = existing?.stockDeducted && existing.menuId === values.menuId
            ? existing.quantity
            : 0;
        const quantity = Number(values.quantity);

        if (!selectedMenu || quantity > Number(selectedMenu.stock) + returnedQuantity) {
            showToast('Stok menu tidak cukup untuk jumlah pesanan.', 'error');
            submitButton.disabled = false;
            return;
        }

        if (existing?.stockDeducted && existingMenu) {
            existingMenu.stock += existing.quantity;
        }
        selectedMenu.stock -= quantity;
        const record = {
            id: editingId || `DF-${String(Date.now()).slice(-6)}`,
            customer: values.customer.trim(),
            menuId: values.menuId,
            quantity,
            status: values.status,
            createdAt: existing?.createdAt || dateForDaysAgo(0),
            stockDeducted: true
        };
        if (editingId) {
            transactions = transactions.map((item) => item.id === editingId ? record : item);
        } else {
            transactions.unshift(record);
        }
    }

    try {
        persist();
    } catch (error) {
        menuItems = previousMenuItems;
        transactions = previousTransactions;
        renderDashboard();
        showToast('Data gagal disimpan ke penyimpanan browser.', 'error');
        submitButton.disabled = false;
        return;
    }

    renderDashboard();
    document.getElementById('data-dialog').close();
    submitButton.disabled = false;
    showToast(`${activeType === 'menu' ? 'Menu' : 'Pesanan'} berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}.`);
});
```

## 5. Pemberitahuan Sistem dan Event Pointer

Event `click` menampilkan pemberitahuan. Event `mouseenter` menahan timer agar
pesan dapat dibaca, kemudian `mouseleave` mengaktifkan kembali timer.

```javascript
// TUGAS BAB 4 - Event click menampilkan pemberitahuan aktivitas Sistem DAFFOOD.
toastTrigger.addEventListener('click', () => {
    toastMessage.textContent = 'Informasi Sistem Manajemen DAFFOOD berhasil ditampilkan.';
    toastMessage.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastMessage.classList.remove('is-visible'), 2600);
});

// TUGAS BAB 4 - Event pointer menahan dan melanjutkan timer pemberitahuan.
toastMessage.addEventListener('mouseenter', () => clearTimeout(toastTimer));
toastMessage.addEventListener('mouseleave', () => {
    toastTimer = setTimeout(() => toastMessage.classList.remove('is-visible'), 2600);
});
```

## 6. Fetch

Fetch belum digunakan karena project belum memiliki backend atau API yang dapat
menyediakan data. Data menu, pesanan, preferensi, dan profil demo saat ini
dikelola melalui Web Storage pada browser.

## 7. Tutorial Menjalankan dan Mencoba Fitur

### A. Menjalankan project

1. Buka folder project di Visual Studio Code.
2. Jalankan `index.html` di browser. Jika tersedia, gunakan ekstensi Live Server
   lalu pilih **Open with Live Server** pada `index.html`.
3. Beranda menampilkan Sistem Manajemen DAFFOOD. Pilih **Masuk** untuk membuka
   formulir login atau **Mulai sekarang** untuk mencoba pendaftaran.
4. Project ini berjalan sebagai simulasi frontend. Tidak diperlukan server
   database, tetapi fitur penyimpanan browser perlu diizinkan.

### B. Mencoba pendaftaran, login, asynchronous, dan Promise

1. Dari beranda, tekan **Mulai sekarang**.
2. Isi nama lengkap, email yang valid, kata sandi, lalu centang persetujuan.
3. Tekan **Buat akun**. Tunggu pesan berhasil, kemudian halaman akan berpindah
   ke login. Profil nama dan email disimpan di `localStorage`; kata sandi tidak
   disimpan.
4. Masukkan email yang sama dan kata sandi pada halaman login, lalu tekan
   **Masuk ke dashboard**.
5. Proses menunggu sebentar menggunakan `async/await` dan Promise, menampilkan
   pemberitahuan, lalu membuka dashboard. Karena belum ada backend, login
   merupakan simulasi dan bukan autentikasi sungguhan.
6. Gunakan tombol **Tampilkan/Sembunyikan** di samping kata sandi untuk mencoba
   event `click` dan perubahan DOM pada formulir.

### C. Mencoba navigasi dan Web Storage

1. Di dashboard, gunakan navigasi samping: **Ringkasan**, **Produk & Menu**,
   **Manajemen Pesanan**, **Laporan Penjualan**, dan **Pemantauan Stok**.
2. Navigasi dashboard memakai hash URL. Coba tombol kembali/maju browser untuk
   melihat event `hashchange` memperbarui tampilan.
3. Ubah tema melalui tombol **Gelap/Terang** atau pilihan **Warna**. Muat ulang
   halaman untuk melihat preferensi yang disimpan tetap diterapkan.
4. Menu, pesanan, sesi login, catatan laporan, dan preferensi tersimpan pada
   `localStorage` di browser yang sama.

### D. Mencoba pengelolaan menu dan popup hapus

1. Buka **Produk & Menu**.
2. Ketik nama atau kategori pada kotak pencarian untuk memfilter data. Event
   `input` memperbarui baris tabel dan jumlah menu.
3. Tekan **Tambah menu**, isi nama, kategori, harga, dan stok, lalu tekan
   **Simpan data**. Perubahan diproses asynchronous lalu tersimpan.
4. Gunakan tombol edit untuk mengubah menu.
5. Tekan ikon **×/Hapus** untuk menampilkan Popup Box `confirm`.
6. Pilih **Cancel/Batal** untuk mempertahankan menu, atau **OK** untuk
   menyetujuinya. Stok/pesanan terkait diperbarui sesuai aturan sistem.

### E. Mencoba pengelolaan pesanan

1. Buka **Manajemen Pesanan**, lalu tekan **Tambah pesanan**.
2. Masukkan nama pelanggan, pilih menu, jumlah, dan status. Simpan pesanan.
   Sistem mengurangi stok menu sesuai jumlah pesanan.
3. Gunakan kotak pencarian untuk mencari pesanan, atau pilihan status untuk
   menampilkan pesanan tertentu.
4. Gunakan tombol edit untuk memperbarui pesanan. Stok diperiksa sebelum
   perubahan diterapkan.
5. Tekan tombol hapus pada baris pesanan untuk melihat Popup Box konfirmasi.
   Pembatalan tidak menghapus data; persetujuan menghapus pesanan dan
   mengembalikan stok terkait.
6. Tekan **Unduh CSV** untuk mengunduh transaksi yang sesuai pencarian dan filter
   status saat ini.

### F. Mencoba Popup Box catatan laporan

1. Buka **Laporan Penjualan**.
2. Tekan **Tambah catatan laporan**. Popup Box `prompt` meminta catatan.
3. Masukkan catatan lalu pilih **OK** untuk menyimpannya. Catatan tampil di
   bawah grafik dan disimpan di Web Storage.
4. Pilih **Cancel/Batal** untuk menutup popup tanpa perubahan.
5. Coba kirim isian kosong untuk melihat Popup Box `alert` yang meminta catatan
   tidak boleh kosong. Catatan tersimpan akan tampil kembali setelah halaman
   dimuat ulang.

### G. Mencoba popup keluar, pemberitahuan, dan event tambahan

1. Pada sisi bawah navigasi dashboard, tekan **Keluar**. Popup Box `confirm`
   akan meminta konfirmasi.
2. Pilih **Cancel/Batal** untuk tetap berada di dashboard. Pilih **OK** untuk
   menghapus sesi demo dan berpindah ke halaman login.
3. Dari beranda, buka tautan **Lihat pemberitahuan** untuk menuju halaman
   pemberitahuan Sistem DAFFOOD.
4. Tekan **Uji pemberitahuan** untuk memunculkan pesan melalui event `click`.
   Arahkan pointer ke pesan untuk menahan waktu tampil (`mouseenter`), kemudian
   geser pointer keluar (`mouseleave`) agar hitung mundur berjalan kembali.
5. Event lain yang dapat dicoba adalah `input` pada kotak pencarian, `change`
   pada filter status/warna, `submit` pada formulir, dan `hashchange` pada
   navigasi dashboard.
