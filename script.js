// ==== SUPABASE CONFIGURATION ====
const sb = supabase.createClient(
    'https://bxhrnnwfqlsoviysqcdw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aHJubndmcWxzb3ZpeXNxY2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODkzNDIsImV4cCI6MjA4MTM2NTM0Mn0.O7fpv0TrDd-8ZE3Z9B5zWyAuWROPis5GRnKMxmqncX8'
);

// ==== GLOBAL VARIABLES ====
let currentUser = null;
let currentClick = 0;
let verificationCode = '';

// ==== DOM ELEMENTS ====
const btn = document.getElementById('btn');
const panel = document.getElementById('panel');
const photo = document.getElementById('photo');
const count = document.getElementById('count');
const reg_user = document.getElementById('reg_user');
const reg_pass = document.getElementById('reg_pass');
const reg_verif = document.getElementById('reg_verif');
const log_user = document.getElementById('log_user');
const log_pass = document.getElementById('log_pass');

// ==== ANTI INSPECT & KLIK KANAN ====
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('keydown', function(e) {
    // Block F12
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    
    // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) {
        e.preventDefault();
        return false;
    }
    
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
    }
    
    // Block DevTools dengan tombol lain
    if (e.key === 'F8' || (e.ctrlKey && e.key === 'S') || (e.ctrlKey && e.key === 'C')) {
        e.preventDefault();
        return false;
    }
});

// Deteksi DevTools opening (basic detection)
setInterval(function() {
    const before = new Date();
    debugger;
    const after = new Date();
    if (after - before > 100) {
        window.location.reload();
    }
}, 1000);

// ==== VERIFICATION CODE ====
function generateVerificationCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const verifCodeElement = document.getElementById('verif-code');
    const copyHintElement = document.getElementById('copy-hint');
    
    if (verifCodeElement) {
        verifCodeElement.textContent = code;
        verificationCode = code;
        
        // Tambahkan fungsi klik untuk copy
        verifCodeElement.onclick = function() {
            navigator.clipboard.writeText(code).then(() => {
                copyHintElement.textContent = '✓ Kode disalin!';
                copyHintElement.style.color = '#4CAF50';
                
                setTimeout(() => {
                    copyHintElement.textContent = 'Klik untuk menyalin, lalu tempel di bawah';
                    copyHintElement.style.color = '#666';
                }, 2000);
            }).catch(err => {
                console.error('Gagal menyalin: ', err);
                copyHintElement.textContent = 'Gagal menyalin, salin manual';
                copyHintElement.style.color = '#f44336';
            });
        };
    }
}

// ==== EVENT LISTENERS ====
btn.addEventListener('click', () => {
    panel.classList.add('show');
    generateVerificationCode(); // Generate kode baru setiap kali panel dibuka
});

photo.addEventListener('click', handlePhotoClick);

// ==== FUNCTIONS ====

// Handle photo click
async function handlePhotoClick() {
    if (!currentUser) {
        alert('Login dulu');
        return;
    }

    const audio = new Audio('suara.mp3');
    audio.playbackRate = 2;
    audio.play().catch(e => console.log('Audio gagal diputar:', e));

    currentClick++;
    count.textContent = currentClick;

    try {
        await sb.from('KLIKUSER')
            .update({ jumlah_klik: currentClick })
            .eq('username', currentUser);
    } catch (error) {
        console.error('Error updating click count:', error);
        alert('Gagal menyimpan klik, coba lagi');
    }
}

// Register function
async function register() {
    const u = reg_user.value.trim();
    const p = reg_pass.value.trim();
    const v = reg_verif.value.trim();
    
    if (!u || !p || !v) {
        alert('Isi semua kolom');
        return;
    }
    
    // Verifikasi kode
    if (v !== verificationCode) {
        alert('Kode verifikasi salah! Silakan salin kode yang benar dari atas.');
        generateVerificationCode(); // Generate kode baru
        return;
    }
    
    if (u.length < 3) {
        alert('Username minimal 3 karakter');
        return;
    }
    
    if (p.length < 6) {
        alert('Password minimal 6 karakter');
        return;
    }

    try {
        const { error } = await sb.from('KLIKUSER')
            .insert({ username: u, password: p, jumlah_klik: 0 });

        if (error) {
            if (error.code === '23505') {
                alert('Username sudah ada');
            } else {
                alert('Gagal membuat akun: ' + error.message);
            }
            return;
        }

        alert('Akun berhasil dibuat!');
        currentUser = u;
        currentClick = 0;
        afterLogin();
    } catch (error) {
        console.error('Registration error:', error);
        alert('Gagal membuat akun');
    }
}

// Login function
async function login() {
    const u = log_user.value.trim();
    const p = log_pass.value.trim();

    try {
        const { data, error } = await sb.from('KLIKUSER')
            .select('*')
            .eq('username', u)
            .eq('password', p)
            .single();

        if (error || !data) {
            alert('Login gagal. Username atau password salah.');
            return;
        }

        currentUser = u;
        currentClick = data.jumlah_klik || 0;
        afterLogin();
    } catch (error) {
        console.error('Login error:', error);
        alert('Login gagal');
    }
}

// After login handler
function afterLogin() {
    count.textContent = currentClick;

    panel.innerHTML = `
        <button onclick="panel.classList.remove('show')">Tutup</button>
        <button class="logout" onclick="logout()">🚪 Log Out</button>
        <button onclick="loadBoard()">🔄 Refresh Leaderboard</button>
        <table id="board">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>Klik</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;
    
    // Add close button event listener
    setTimeout(() => {
        const closeBtn = panel.querySelector('button[onclick="panel.classList.remove(\'show\')"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('show');
            });
        }
    }, 100);
    
    loadBoard();
}

// Logout function
function logout() {
    currentUser = null;
    currentClick = 0;
    count.textContent = 0;

    panel.innerHTML = `
        <h3>DAFTAR</h3>
        <input id="reg_user" placeholder="Username">
        <input id="reg_pass" type="password" placeholder="Password">
        
        <div id="verif-code-container">
            <small>Salin kode verifikasi berikut:</small>
            <div id="verif-code"></div>
            <div id="copy-hint">Klik untuk menyalin, lalu tempel di bawah</div>
        </div>
        
        <input id="reg_verif" placeholder="Tempel kode verifikasi di sini">
        <button onclick="register()">Daftar</button>

        <hr>

        <h3>LOGIN</h3>
        <input id="log_user" placeholder="Username">
        <input id="log_pass" type="password" placeholder="Password">
        <button onclick="login()">Login</button>

        <hr>

        <button onclick="loadBoard()">🔄 Refresh Leaderboard</button>
        <table id="board">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>Klik</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;
    
    // Re-generate verification code setelah logout
    setTimeout(() => {
        generateVerificationCode();
    }, 100);
}

// Load leaderboard
async function loadBoard() {
    try {
        const { data, error } = await sb.from('KLIKUSER')
            .select('*')
            .order('jumlah_klik', { ascending: false });

        if (error) {
            console.error('Error loading leaderboard:', error);
            return;
        }

        const board = document.getElementById('board');
        const boardTbody = board ? board.querySelector('tbody') : null;
        
        if (!boardTbody) return;

        boardTbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            boardTbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center; padding:20px;">
                        Belum ada data
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach((r, i) => {
            let cls = '';
            if (i === 0) cls = 'gold';
            else if (i === 1) cls = 'silver';
            else if (i === 2) cls = 'bronze';
            if (r.username === currentUser) cls += ' me';

            const row = document.createElement('tr');
            row.className = cls;
            row.innerHTML = `
                <td>${i + 1}</td>
                <td>${r.username}</td>
                <td>${r.jumlah_klik || 0}</td>
            `;
            boardTbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error in loadBoard:', error);
    }
}

// ==== INITIALIZATION ====
document.addEventListener('DOMContentLoaded', function() {
    generateVerificationCode();
    loadBoard();
    
    // Check if user is already logged in (optional - bisa disimpan di localStorage)
    const savedUser = localStorage.getItem('klikUser');
    if (savedUser) {
        // Jika ingin fitur auto-login, bisa diimplementasikan di sini
    }
});
