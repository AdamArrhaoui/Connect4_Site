

function isUsernameValid(username){
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

function isPwValid(pw) {
    if (pw.value.length > pw.maxLength){
        alert("Password is too long!");
        pw.value = "";
        pw.focus();
        return false;
    }

    if (pw.value.length < pw.minLength){
        alert("Password is too short!");
        pw.value = "";
        pw.focus();
        return false;
    }

    return true;
}


function onSubmit() {

    let usernameInput = document.getElementById("username");
    let pwInput = document.getElementById("password");

    return (isUsernameValid(usernameInput) && isPwValid(pwInput));
}

function init(){
    document.getElementById("submit").addEventListener("click", submit);
}

