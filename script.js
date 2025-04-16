// API Base URL configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

// Page Navigation Functions (remain the same)
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById('home').classList.add('hidden');
    document.getElementById(pageId).classList.remove('hidden');
}

function goHome() {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById('home').classList.remove('hidden');
    resetFields();
}

// ... other navigation functions remain the same ...

// Encryption/Decryption Functions (updated for backend)
async function encryptImage() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showPopupMessage("❌ No image selected!");
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_BASE_URL}/api/encrypt/image`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
            document.getElementById('imagePasskey').innerHTML = `<span class="green-text">Passkey: ${result.passkey}</span>`;
            showPopupMessage("✅ Image Encrypted!");
        } else {
            showPopupMessage(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showPopupMessage("❌ Failed to encrypt image");
    }
}

async function encryptText() {
    const text = document.getElementById('textInput').value;
    if (!text) {
        showPopupMessage("❌ No text entered!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/encrypt/text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
        });

        const result = await response.json();
        
        if (response.ok) {
            document.getElementById('textPasskey').innerHTML = `<span class="green-text">Passkey: ${result.passkey}</span>`;
            showPopupMessage("✅ Text Encrypted!");
        } else {
            showPopupMessage(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showPopupMessage("❌ Failed to encrypt text");
    }
}

async function decryptImage() {
    const passkey = document.getElementById('imageKeyInput').value;
    if (!passkey) {
        showPopupMessage("❌ Please enter a passkey!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/decrypt/image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ passkey })
        });

        if (response.ok) {
            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);
            
            const imgElement = document.getElementById('decryptedImage');
            imgElement.src = imageUrl;
            imgElement.classList.remove('hidden');
            document.getElementById('imageError').textContent = "";
            
            showPopupMessage("✅ Image Decrypted!");
        } else {
            const error = await response.json();
            document.getElementById('imageError').textContent = `❌ ${error.error}`;
            document.getElementById('decryptedImage').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('imageError').textContent = "❌ Failed to decrypt image";
    }
}

async function decryptText() {
    const passkey = document.getElementById('textKeyInput').value;
    if (!passkey) {
        showPopupMessage("❌ Please enter a passkey!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/decrypt/text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ passkey })
        });

        const result = await response.json();
        
        if (response.ok) {
            document.getElementById('decryptedText').textContent = result.data;
            document.getElementById('textError').textContent = "";
            showPopupMessage("✅ Text Decrypted!");
        } else {
            document.getElementById('textError').textContent = `❌ ${result.error}`;
            document.getElementById('decryptedText').textContent = "";
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('textError').textContent = "❌ Failed to decrypt text";
    }
}

// Helper functions remain the same
function resetFields() {
    /* ... existing resetFields code ... */
}

function showPopupMessage(message) {
    /* ... existing showPopupMessage code ... */
}