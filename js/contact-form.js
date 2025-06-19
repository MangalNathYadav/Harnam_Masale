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
            const clientId = this.generateSubmissionId();
            
            // Prepare data
            const contactData = {
                name: name,
                email: email,
                message: message,
                phone: phone || '',
                subject: subject || '',
                clientId: clientId,
                status: 'new',
                timestamp: Date.now()
            };
            
            try {
                // Send data using our centralized method
                const result = await this.sendContactForm(contactData);
                
                if (result.success) {
                    // Reset form on success
                    form.reset();
                    
                    // Show success message
                    if (notificationFn) {
                        notificationFn('Thank you! Your message has been sent successfully.', 'success');
                    }
                } else {
                    // Show error message
                    if (notificationFn) {
                        notificationFn(result.message || 'Failed to send message. Please try again.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error submitting contact form:', error);
                
                // Show error message
                if (notificationFn) {
                    notificationFn('An error occurred while sending your message. Please try again.', 'error');
                }
            } finally {
                // Reset submission flag
                this._isSubmitting = false;
                
                // Reset button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    },

    // Function to send the contact form data to Firebase
    async sendContactForm(contactData) {
        try {
            // Check if Firebase is initialized and available
            if (!window.firebase || !window.firebase.database) {
                console.error('Firebase is not initialized.');
                return {
                    success: false,
                    message: 'Internal error: Firebase not available.'
                };
            }

            // Get a reference to the contacts node in Firebase
            const contactsRef = firebase.database().ref('contacts');

            // Add server timestamp
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
