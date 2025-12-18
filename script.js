// ==== SUPABASE CONFIGURATION ====
const sb = supabase.createClient(
    'https://bxhrnnwfqlsoviysqcdw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aHJubndmcWxzb3ZpeXNxY2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODkzNDIsImV4cCI6MjA4MTM2NTM0Mn0.O7fpv0TrDd-8ZE3Z9B5zWyAuWROPis5GRnKMxmqncX8'
);

// ==== GLOBAL VARIABLES ====
let currentUser = null;
let currentClick = 0;
let verificationCode = '';
let profileSettings = {
    bgColor: '#2196F3',
    textColor: '#FFFFFF',
    borderColor: '#1976D2',
    gradientMode: 'none',
    bgPattern: 'none',
    profilePhoto: null,
    profileVideo: null
};

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
const profileCanvas = document.getElementById('profile-canvas');
const modalCanvas = document.getElementById('modal-canvas');
const profileNameElement = document.getElementById('profile-name');

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

// Deteksi DevTools opening
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

// ==== TAB SWITCHING ====
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    if (tabName === 'leaderboard') {
        loadBoard();
    }
}

// ==== PROFILE CUSTOMIZATION FUNCTIONS ====

// Draw pattern on canvas
function drawPattern(ctx, pattern, width, height) {
    switch(pattern) {
        case 'dots':
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            for(let i = 0; i < width; i += 10) {
                for(let j = 0; j < height; j += 10) {
                    if((i + j) % 20 === 0) {
                        ctx.beginPath();
                        ctx.arc(i, j, 1, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            break;
            
        case 'lines':
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            for(let i = 0; i < width; i += 15) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, height);
                ctx.stroke();
            }
            break;
            
        case 'grid':
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            for(let i = 0; i < width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, height);
                ctx.stroke();
            }
            for(let i = 0; i < height; i += 20) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(width, i);
                ctx.stroke();
            }
            break;
            
        case 'stars':
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            for(let i = 0; i < 20; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 2 + 1;
                
                ctx.beginPath();
                ctx.moveTo(x, y - size);
                for(let j = 0; j < 5; j++) {
                    const angle = (j * 72 - 90) * Math.PI / 180;
                    const px = x + size * Math.cos(angle);
                    const py = y + size * Math.sin(angle);
                    ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
            }
            break;
    }
}

// Create gradient
function createGradient(ctx, mode, color1, color2, width, height) {
    let gradient;
    
    switch(mode) {
        case 'linear':
            gradient = ctx.createLinearGradient(0, 0, width, height);
            break;
        case 'radial':
            gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
            break;
        default:
            return color1;
    }
    
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2 || color1);
    return gradient;
}

// Draw profile badge
function drawProfileBadge(canvas, username, settings, isPreview = false) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = settings.gradientMode !== 'none' 
        ? createGradient(ctx, settings.gradientMode, settings.bgColor, settings.borderColor, width, height)
        : settings.bgColor;
    
    // Rounded rectangle
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // Draw pattern
    drawPattern(ctx, settings.bgPattern, width, height);
    
    // Draw border
    ctx.strokeStyle = settings.borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw username
    ctx.fillStyle = settings.textColor;
    ctx.font = `bold ${isPreview ? '24px' : '16px'} Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow for text
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillText(username, width/2, height/2);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw crown for top players
    if (!isPreview && currentUser === username && currentClick > 100) {
        drawCrown(ctx, width/2, 15);
    }
}

// Draw crown for top players
function drawCrown(ctx, x, y) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 15, y + 10);
    ctx.lineTo(x - 8, y + 10);
    ctx.lineTo(x - 8, y + 20);
    ctx.lineTo(x + 8, y + 20);
    ctx.lineTo(x + 8, y + 10);
    ctx.lineTo(x + 15, y + 10);
    ctx.closePath();
    ctx.fill();
    
    // Jewels
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(x, y + 5, 3, 0, Math.PI * 2);
    ctx.fill();
}

// Update profile preview
function updateProfilePreview() {
    if (!currentUser) return;
    
    // Update settings from inputs
    profileSettings.bgColor = document.getElementById('bg-color').value;
    profileSettings.textColor = document.getElementById('text-color').value;
    profileSettings.borderColor = document.getElementById('border-color').value;
    profileSettings.gradientMode = document.getElementById('gradient-mode').value;
    profileSettings.bgPattern = document.getElementById('bg-pattern').value;
    
    // Draw on preview canvas
    drawProfileBadge(profileCanvas, currentUser, profileSettings);
    
    // Update main profile display
    profileNameElement.textContent = currentUser;
}

// Save profile to Supabase
async function saveProfile() {
    if (!currentUser) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    try {
        // Handle profile photo upload
        const profilePhotoInput = document.getElementById('profile-photo');
        let profilePhotoUrl = null;
        
        if (profilePhotoInput.files && profilePhotoInput.files[0]) {
            const file = profilePhotoInput.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('Foto maksimal 5MB');
                return;
            }
            
            const fileName = `${currentUser}_${Date.now()}_${file.name}`;
            const { data: photoData, error: photoError } = await sb.storage
                .from('profile-photos')
                .upload(fileName, file);
            
            if (photoError) throw photoError;
            
            const { data: publicUrlData } = sb.storage
                .from('profile-photos')
                .getPublicUrl(fileName);
            
            profilePhotoUrl = publicUrlData.publicUrl;
            profileSettings.profilePhoto = profilePhotoUrl;
            
            // Update profile image
            document.getElementById('user-profile-img').src = profilePhotoUrl;
        }
        
        // Handle video upload
        const profileVideoInput = document.getElementById('profile-video');
        let profileVideoUrl = null;
        
        if (profileVideoInput.files && profileVideoInput.files[0]) {
            const file = profileVideoInput.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('Video maksimal 5MB');
                return;
            }
            
            const fileName = `${currentUser}_${Date.now()}_${file.name}`;
            const { data: videoData, error: videoError } = await sb.storage
                .from('profile-videos')
                .upload(fileName, file);
            
            if (videoError) throw videoError;
            
            const { data: publicUrlData } = sb.storage
                .from('profile-videos')
                .getPublicUrl(fileName);
            
            profileVideoUrl = publicUrlData.publicUrl;
            profileSettings.profileVideo = profileVideoUrl;
        }
        
        // Save profile settings to database
        const { error } = await sb.from('KLIKUSER')
            .update({
                profile_settings: profileSettings,
                profile_photo: profilePhotoUrl,
                profile_video: profileVideoUrl,
                updated_at: new Date().toISOString()
            })
            .eq('username', currentUser);
        
        if (error) throw error;
        
        alert('Profil berhasil disimpan!');
        loadBoard(); // Refresh leaderboard
        
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Gagal menyimpan profil');
    }
}

// Open profile modal
function openProfileModal() {
    if (!currentUser) return;
    
    // Update modal canvas
    drawProfileBadge(modalCanvas, currentUser, profileSettings, true);
    
    // Update modal username
    document.getElementById('modal-username').textContent = currentUser;
    
    // Show modal
    document.getElementById('profile-modal').style.display = 'flex';
}

// Close profile modal
function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

// ==== EVENT LISTENERS ====
btn.addEventListener('click', () => {
    panel.classList.add('show');
    generateVerificationCode(); // Generate kode baru setiap kali panel dibuka
});

photo.addEventListener('click', handlePhotoClick);

// Profile customization listeners
document.getElementById('bg-color').addEventListener('input', updateProfilePreview);
document.getElementById('text-color').addEventListener('input', updateProfilePreview);
document.getElementById('border-color').addEventListener('input', updateProfilePreview);
document.getElementById('gradient-mode').addEventListener('change', updateProfilePreview);
document.getElementById('bg-pattern').addEventListener('change', updateProfilePreview);

// Profile photo upload
document.getElementById('profile-photo').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('user-profile-img').src = e.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// Profile video upload
document.getElementById('profile-video').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        // You can implement video preview here if needed
        console.log('Video selected:', e.target.files[0].name);
    }
});

// ==== FUNCTIONS ====

// Handle photo click
async function handlePhotoClick() {
    if (!currentUser) {
        alert('Login dulu');
        return;
    }

    // Play sound
    const audio = new Audio('suara.mp3');
    audio.playbackRate = 2;
    audio.play().catch(e => console.log('Audio gagal diputar:', e));

    // Update click count
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
            .insert({ 
                username: u, 
                password: p, 
                jumlah_klik: 0,
                profile_settings: profileSettings,
                created_at: new Date().toISOString()
            });

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
        
        // Load profile settings if exists
        if (data.profile_settings) {
            profileSettings = { ...profileSettings, ...data.profile_settings };
            
            // Update form inputs
            document.getElementById('bg-color').value = profileSettings.bgColor || '#2196F3';
            document.getElementById('text-color').value = profileSettings.textColor || '#FFFFFF';
            document.getElementById('border-color').value = profileSettings.borderColor || '#1976D2';
            document.getElementById('gradient-mode').value = profileSettings.gradientMode || 'none';
            document.getElementById('bg-pattern').value = profileSettings.bgPattern || 'none';
            
            // Update profile image
            if (data.profile_photo) {
                document.getElementById('user-profile-img').src = data.profile_photo;
            }
        }
        
        afterLogin();
    } catch (error) {
        console.error('Login error:', error);
        alert('Login gagal');
    }
}

// After login handler
function afterLogin() {
    count.textContent = currentClick;
    profileNameElement.textContent = currentUser;
    
    // Update profile preview
    updateProfilePreview();
    
    // Switch to game tab
    switchTab('game');
}

// Logout function
function logout() {
    currentUser = null;
    currentClick = 0;
    count.textContent = 0;
    profileNameElement.textContent = '';
    
    // Reset profile image
    document.getElementById('user-profile-img').src = 'default-profile.webp';
    
    // Reset form
    reg_user.value = '';
    reg_pass.value = '';
    reg_verif.value = '';
    log_user.value = '';
    log_pass.value = '';
    
    // Switch to game tab
    switchTab('game');
    
    // Close panel
    panel.classList.remove('show');
}

// Load leaderboard with profile badges
async function loadBoard() {
    try {
        const { data, error } = await sb.from('KLIKUSER')
            .select('*')
            .order('jumlah_klik', { ascending: false });

        if (error) {
            console.error('Error loading leaderboard:', error);
            return;
        }

        const boardTbody = document.querySelector('#board tbody');
        if (!boardTbody) return;

        boardTbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            boardTbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding:20px;">
                        Belum ada data
                    </td>
                </tr>
            `;
            return;
        }

        // Create offscreen canvas for generating mini badges
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 100;
        miniCanvas.height = 40;
        const miniCtx = miniCanvas.getContext('2d');

        data.forEach((user, index) => {
            const row = document.createElement('tr');
            let rowClass = '';
            
            if (index === 0) rowClass = 'gold rank-1';
            else if (index === 1) rowClass = 'silver rank-2';
            else if (index === 2) rowClass = 'bronze rank-3';
            if (user.username === currentUser) rowClass += ' me';
            
            row.className = rowClass;
            
            // Generate mini badge
            const userSettings = user.profile_settings || profileSettings;
            drawProfileBadge(miniCanvas, user.username, userSettings);
            const badgeDataURL = miniCanvas.toDataURL();
            
            // Create mini badge image
            const badgeImg = document.createElement('img');
            badgeImg.src = badgeDataURL;
            badgeImg.className = 'profile-mini-canvas';
            
            // Add video icon if user has video
            let videoIcon = '';
            if (user.profile_video) {
                videoIcon = ' 🎥';
            }
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="profile-cell">
                    <div style="position: relative;">
                        ${badgeImg.outerHTML}
                        ${user.profile_photo ? `<img src="${user.profile_photo}" style="position: absolute; top: -15px; right: -15px; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">` : ''}
                    </div>
                </td>
                <td>${user.username}${videoIcon}</td>
                <td>${user.jumlah_klik || 0}</td>
            `;
            
            // Add click event to view profile details
            row.addEventListener('click', function() {
                if (user.username === currentUser) {
                    openProfileModal();
                } else {
                    alert(`Profil ${user.username}\nKlik: ${user.jumlah_klik || 0}`);
                }
            });
            
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
    
    // Add event listener for close panel button
    document.getElementById('close-panel').addEventListener('click', function() {
        panel.classList.remove('show');
    });
    
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('klikUser');
    if (savedUser) {
        // Optional: Implement auto-login here
    }
});
