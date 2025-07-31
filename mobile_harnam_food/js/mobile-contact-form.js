// =============== This is the Mobile Contact Form Handler for Harnam Masale, making sure your messages actually get sent! ===============
// =============== Adapts desktop contact-form.js logic for mobile, because mobile users matter too ===============

const MobileContactFormHandler = {
    _isSubmitting: false,

    generateSubmissionId() {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000000);
        return `submission_${timestamp}_${random.toString().padStart(6, '0')}`;
    },

    setupFormSubmission(form, notificationFn) {
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this._isSubmitting) return;

            const name = form.querySelector('#mobile-name')?.value;
            const email = form.querySelector('#mobile-email')?.value;
            const phone = form.querySelector('#mobile-phone')?.value;
            const subject = form.querySelector('#mobile-subject')?.value;
            const message = form.querySelector('#mobile-message')?.value;

            if (!name || !email || !message) {
                if (notificationFn) notificationFn('Please fill in all required fields.', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            let originalText = '';
            if (submitBtn) {
                if (submitBtn.disabled) return;
                submitBtn.disabled = true;
                originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            }

            this._isSubmitting = true;
            const clientId = this.generateSubmissionId();
            const contactData = {
                name,
                email,
                message,
                phone: phone || '',
                subject: subject || '',
                clientId,
                status: 'new',
                timestamp: Date.now()
            };

            try {
                const result = await this.sendContactForm(contactData);
                if (result.success) {
                    form.reset();
                    if (notificationFn) notificationFn('Thank you! Your message has been sent successfully.', 'success');
                } else {
                    if (notificationFn) notificationFn(result.message || 'Failed to send message. Please try again.', 'error');
                }
            } catch (error) {
                if (notificationFn) notificationFn('An error occurred while sending your message. Please try again.', 'error');
            } finally {
                this._isSubmitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    },

    async sendContactForm(contactData) {
        try {
            // =============== If Firebase isn't available, we can't send the message, sorry! ===============
            if (!window.firebase || !window.firebase.database) {
                return { success: false, message: 'Internal error: Firebase not available.' };
            }
            // =============== Push the contact data to Firebase, fingers crossed it works ===============
            const contactsRef = firebase.database().ref('contacts');
            contactData.timestamp = firebase.database.ServerValue.TIMESTAMP;
            const newContactRef = await contactsRef.push(contactData);
            // =============== Return success message, because everyone likes good news ===============
            return { success: true, contactId: newContactRef.key, message: 'Contact form submitted successfully' };
        } catch (error) {
            return { success: false, message: 'Failed to submit contact form. Please try again.' };
        }
    }
};

window.MobileContactFormHandler = MobileContactFormHandler;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mobileContactForm');
    const notificationDiv = document.getElementById('notification');
    function showNotification(msg, type) {
        if (!notificationDiv) return;
        notificationDiv.innerText = msg;
        notificationDiv.className = 'notification ' + (type === 'success' ? 'success' : 'error');
        notificationDiv.style.display = 'block';
        setTimeout(() => { notificationDiv.style.display = 'none'; }, 4000);
    }
    if (form) {
        MobileContactFormHandler.setupFormSubmission(form, showNotification);
    }
});
