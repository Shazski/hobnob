function changeQuantity(cartId,proId,userId,count) {
    let quantity=parseInt(document.getElementById(proId).innerText)
  count=parseInt(count)
  $.ajax({
    url:'/change-product-quantity',
    data:{
        user:userId,
        cartId:cartId,
        proId:proId,
        count:count,
        quantity:quantity,
        
    },
    method:'post',
    success:(response)=>{
        if(response.removeProduct){
            alert("product is remmoved from the cart")
            location.reload()
        } else if(response.status == false) {
            document.getElementById('quantityError').innerText = "Out of stock"
        }else{
            document.getElementById(proId).innerText=quantity+count
            document.getElementById('quantityError').innerText = ""
            document.getElementById('total').innerText=response[0].total
            document.getElementById('totalAmount').innerText=response[0].total
        }
    }
  })
  }