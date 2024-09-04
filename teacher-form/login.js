document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const eye = document.getElementById('eye');
    const showPasswordCheckbox = document.getElementById('show-password');

    const eyeFrames = ['assets/eye1.png', 'assets/eye2.png', 'assets/eye3.png', 'assets/eye4.png', 'assets/eye5.png'];
    const eyePassword = 'assets/eye-password.png';
    const eyeVisible = 'assets/eye-visible.png';

    function moveEye(input) {
        const inputLength = input.value.length;
        const maxLength = input.getAttribute('maxlength') || 20;
        const fifthLength = maxLength / 5;

        let frameIndex;
        if (inputLength < fifthLength) {
            frameIndex = 0;
        } else if (inputLength < 2 * fifthLength) {
            frameIndex = 1;
        } else if (inputLength < 3 * fifthLength) {
            frameIndex = 2;
        } else if (inputLength < 4 * fifthLength) {
            frameIndex = 3;
        } else {
            frameIndex = 4;
        }

        eye.style.backgroundImage = `url(${eyeFrames[frameIndex]})`;
    }

    function adjustEyeOnFocus() {
        if (usernameInput.value.length > 0) {
            moveEye(usernameInput);
        } else {
            eye.style.backgroundImage = `url(${eyeFrames[1]})`;
        }
    }

    function checkBothBlur() {
        if (!usernameInput.matches(':focus') && !passwordInput.matches(':focus') && !showPasswordCheckbox.matches(':focus')) {
            eye.style.backgroundImage = `url(${eyeFrames[0]})`;
        }
    }

    usernameInput.addEventListener('focus', adjustEyeOnFocus);

    usernameInput.addEventListener('blur', () => {
        checkBothBlur();
    });

    usernameInput.addEventListener('input', () => {
        if (usernameInput.value.length > 0) {
            moveEye(usernameInput);
        } else {
            eye.style.backgroundImage = `url(${eyeFrames[1]})`;
        }
    });

    passwordInput.addEventListener('focus', () => {
        if (showPasswordCheckbox.checked) {
            eye.style.backgroundImage = `url(${eyeVisible})`;
        } else {
            eye.style.backgroundImage = `url(${eyePassword})`;
        }
    });

    passwordInput.addEventListener('blur', () => {
        checkBothBlur();
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.value.length === 0) {
            showPasswordCheckbox.checked = false;
            passwordInput.setAttribute('type', 'password');
            eye.style.backgroundImage = `url(${eyePassword})`;
        } else if (showPasswordCheckbox.checked) {
            moveEye(passwordInput);
        }
    });

    showPasswordCheckbox.addEventListener('change', () => {
        const type = showPasswordCheckbox.checked ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        eye.style.backgroundImage = `url(${showPasswordCheckbox.checked ? eyeVisible : eyePassword})`;
        if (showPasswordCheckbox.checked && passwordInput.value.length > 0) {
            moveEye(passwordInput);
        }
    });

    showPasswordCheckbox.addEventListener('blur', () => {
        checkBothBlur();
    });

    showPasswordCheckbox.addEventListener('click', () => {
        if (!usernameInput.matches(':focus') && !passwordInput.matches(':focus')) {
            eye.style.backgroundImage = `url(${eyeFrames[0]})`;
        }
    });
});

// dark-mode
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('dark-mode-toggle');
    toggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', toggle.checked);
    });
});

// toggle dark-mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const buttons = document.querySelectorAll('button');
    buttons.forEach(function(button) {
        button.classList.toggle('dark-mode');
    });
}
