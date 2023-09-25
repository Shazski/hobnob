$(document).ready(() => {
    $("#getOtp").click((e) => {
      e.preventDefault();
      $.ajax({
        url: "/get-otp",
        method: "post",
        data: $("#sign-up-form").serialize(),
      })
        .done((data) => {
          console.log("data is got", data);
          if (data) {
            $("#errId").text(data);
          } else if (data === " ") {
            $("#errId").text(data);
          }
        })
        .fail((err) => {
          console.log(err);
        });
    });
  });