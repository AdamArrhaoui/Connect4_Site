
function isPwValid(pw, confirmPw) {
    if (!pw.value.match(/^\w+$/)){
        alert("Password must only contain letters, numbers, or underscores!");
        pw.value = "";
        confirmPw.value = "";
        pw.focus();
        return false;
    }

    if (pw.value !== confirmPw.value){
        alert("Passwords much match!");
        confirmPw.value = "";
        confirmPw.focus();
        return false;
    }

    if (pw.value.length > pw.maxLength){
        alert("Password is too long!");
        pw.value = "";
        confirmPw.value = "";
        pw.focus();
        return false;
    }

    if (pw.value.length < pw.minLength){
        alert("Password is too short!");
        pw.value = "";
        confirmPw.value = "";
        pw.focus();
        return false;
    }

    return true;
}

function isUsernameValid(username){
    if (!username.value.match(/^\w+$/)){
        alert("Username must only contain letters, numbers, or underscores!");
        username.focus();
        return false;
    }
    if (username.value.length > username.maxLength){
        alert("Username is too long!");
        username.focus();
        return false;
    }

    if (username.value.length < username.minLength){
        alert("Username is too short!");
        username.focus();
        return false;
    }

    return true;
}


function onSubmit() {
    let usernameInput = document.getElementById("username");
    let pwInput = document.getElementById("password");
    let confirmPwInput = document.getElementById("confirm_password");

    return (isPwValid(pwInput, confirmPwInput) && isUsernameValid(usernameInput));
}