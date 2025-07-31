// =============== Mobile Auth Logic for Login/Signup (Firebase Auth + RTDB user profile), making sign in and sign up less boring! ===============
// =============== Usage: included in login.html and signup.html, so you can actually get into the app ===============

document.addEventListener('DOMContentLoaded', function() {
    const isLogin = window.location.pathname.endsWith('login.html');
    const isSignup = window.location.pathname.endsWith('signup.html');
    const form = document.getElementById('auth-form');
    const loading = document.getElementById('auth-loading');
    const errorMsg = document.getElementById('form-error');
    const passwordToggle = document.getElementById('password-toggle');
    const googleBtn = document.getElementById('google-auth-btn');
    const redirectParam = new URLSearchParams(window.location.search).get('redirect') || 'index';

    // Password show/hide
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const pwdInput = document.getElementById('password');
            if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                passwordToggle.classList.remove('fa-eye');
                passwordToggle.classList.add('fa-eye-slash');
            } else {
                pwdInput.type = 'password';
                passwordToggle.classList.remove('fa-eye-slash');
                passwordToggle.classList.add('fa-eye');
            }
        });
    }

    // Form submit
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            errorMsg.textContent = '';
            loading.classList.add('show');
            let email = form.email.value.trim();
            let password = form.password.value;
            if (!email || !password) {
                errorMsg.textContent = 'Please enter email and password.';
                loading.classList.remove('show');
                return;
            }
            try {
                let userCredential;
                if (isLogin) {
                    userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                } else if (isSignup) {
                    userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    // Create user profile in RTDB
                    const user = userCredential.user;
                    await firebase.database().ref('users/' + user.uid).set({
                        name: form.name ? form.name.value.trim() : '',
                        email: user.email,
                        phone: '',
                        address: {},
                        createdAt: Date.now()
                    });
                }
                // Redirect after login/signup
                window.location.href = redirectParam + '.html';
            } catch (err) {
                errorMsg.textContent = err.message.replace('Firebase:', '').replace('auth/', '');
            }
            loading.classList.remove('show');
        });
    }

    // Google login/signup
    if (googleBtn) {
        googleBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            loading.classList.add('show');
            errorMsg.textContent = '';
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await firebase.auth().signInWithPopup(provider);
                const user = result.user;
                // Check if user profile exists in RTDB
                const userRef = firebase.database().ref('users/' + user.uid);
                const snapshot = await userRef.once('value');
                if (!snapshot.exists()) {
                    // Create user profile
                    await userRef.set({
                        name: user.displayName || '',
                        email: user.email,
                        phone: user.phoneNumber || '',
                        address: {},
                        createdAt: Date.now()
                    });
                }
                window.location.href = redirectParam + '.html';
            } catch (err) {
                errorMsg.textContent = err.message.replace('Firebase:', '').replace('auth/', '');
            }
            loading.classList.remove('show');
        });
    }
});
