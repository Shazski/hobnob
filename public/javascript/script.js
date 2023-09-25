const endTime = new Date().getTime() + 60000;
let inputData;
function emailInput() {
  inputData = document.getElementById("email").value;
}
function updateTimer() {
  if (inputData) {
    const currTime = new Date().getTime();
    const timer = endTime - currTime;
    const displayTimer = document.getElementById("timer");
    const otpDisplay = document.getElementById("getOtp");

    otpDisplay.style.display = "none";
    displayTimer.style.display = "inline";

    if (timer > 0) {
      displayTimer.innerText = (timer / 1000).toFixed(0);
      setTimeout(updateTimer, 1000);
    } else {
      const otpLabel = document.getElementById("getOtp");
      otpLabel.innerText = "Resend Otp";
      otpDisplay.style.display = "inline-block";
      displayTimer.style.display = "none";
    }
  } else {
    console.log("hello guys");
  }
}


