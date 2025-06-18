// Centralized contact form handling

const ContactFormHandler = {
    // Track active submission to prevent duplicates across instances
    _isSubmitting: false,
    
    // Generate a unique submission ID
    generateSubmissionId() {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000000);
        return `submission_${timestamp}_${random.toString().padStart(6, '0')}`;
    },
    
    // Set up form submission handler - universal for all forms
    setupFormSubmission(form, notificationFn) {
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Global submission check
            if (this._isSubmitting) {
                console.log('A form is already being submitted. Preventing duplicate submission.');
                return;
            }
            
            // Get form data
            const name = form.querySelector('#name')?.value;
            const email = form.querySelector('#email')?.value;
            const phone = form.querySelector('#phone')?.value;
            const subject = form.querySelector('#subject')?.value;
            const message = form.querySelector('#message')?.value;
            
            // Validate required fields
            if (!name || !email || !message) {
                if (notificationFn) {
                    notificationFn('Please fill in all required fields.', 'error');
                }
                return;
            }
            
            // Get submit button and disable immediately
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && submitBtn.disabled) {
                console.log('Form submission already in progress');
                return;
            }
            
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            }
            
            // Set global submission flag
            this._isSubmitting = true;
            
            // Generate unique client ID
            const clientId = Date.now() + '-' + Math.random().toString(36).substring(2, 10);
            
            // Prepare data
            const contactData = {
                name: name,
                email: email,
                message: message,
                phone: phone || '',
                subject: subject || '',
                clientId: clientId,
                status: 'new'
            };
            
            try {
                // Send data using our centralized method
                const result = await this.sendContactForm(contactData);
                
                if (result.success) {
                    // Show success message container
                    const formContainer = form.closest('.contact-form-container');
                    if (formContainer) {
                        // Hide the form
                        form.style.display = 'none';
                        
                        // Create and show success message
                        const successMessage = document.createElement('div');
                        successMessage.className = 'success-message animate__animated animate__fadeIn';
                        successMessage.innerHTML = `
                            <div class="success-icon">
                                <i class="fas fa-check"></i>
                            </div>
                            <h3>Thank You!</h3>
                            <p>Your message has been sent successfully. We'll get back to you soon.</p>
                        `;
                        formContainer.appendChild(successMessage);
                    }

                    // Show success notification
                    if (notificationFn) {
                        notificationFn('Message sent successfully!', 'success');
                    }
                    
                    // Reset the form
                    form.reset();
                } else {
                    // Show error message
                    if (notificationFn) {
                        notificationFn(result.message || 'Failed to send message. Please try again.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                if (notificationFn) {
                    notificationFn('An unexpected error occurred. Please try again.', 'error');
                }
            } finally {
                // Re-enable submit button and restore original text
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                }
                
                // Reset submission flag
                this._isSubmitting = false;
            }
        });
    },

    // Function to send the contact form data to the server
    async sendContactForm(data) {
        // TODO: Implement actual form submission to server
        // For now, simulate a successful submission
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true });
            }, 1000);
        });
    },

    // Add method to send data to Firebase
    async sendContactForm(contactData) {
        try {
            // Check if Firebase is initialized
            if (!window.firebase || !window.firebase.database) {
                throw new Error('Firebase is not initialized');
            }

            // Get a reference to the contacts node in Firebase
            const contactsRef = firebase.database().ref('contacts');

            // Add timestamp
            contactData.timestamp = firebase.database.ServerValue.TIMESTAMP;

            // Push the data to Firebase
            const newContactRef = await contactsRef.push(contactData);

            return {
                success: true,
                contactId: newContactRef.key,
                message: 'Contact form submitted successfully'
            };
        } catch (error) {
            console.error('Error sending contact form:', error);
            return {
                success: false,
                message: 'Failed to submit contact form. Please try again.'
            };
        }
    }
};

// Make ContactFormHandler available globally
window.ContactFormHandler = ContactFormHandler;
