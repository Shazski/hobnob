//Import the library into your project
var easyinvoice = require('easyinvoice');
const fs = require("fs")

const downloadInvoice = (orderData) => {
    var data = {
        // Customize enables you to provide your own templates
        // Please review the documentation for instructions and examples
        "customize": {
            //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html 
        },
        "images": {
            // The logo on top of your invoice
            "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
            // The invoice background
            "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
        },
        // Your own data
        "sender": {
            "company": "HOBNOB",
            "address": "Calicut",
            "zip": "673011",
            "city": "kozhikode",
            "country": "india"
            //"custom1": "custom value 1",
            //"custom2": "custom value 2",
            //"custom3": "custom value 3"
        },
        // Your recipient
        "client": {
            "company": "hobnob",
            "address": orderData.address.address,
            "zip": orderData.address.pincode,
            "city": orderData.address.city,
            "country": orderData.address.country
            // "custom1": "custom value 1",
            // "custom2": "custom value 2",
            // "custom3": "custom value 3"
        },
        "information": {
            // Invoice number
            "number": orderData._id,
            // Invoice data
            "date": orderData.orderDate,
            // Invoice due date
        },
        // The products you would like to see on your invoice
        // Total values are being calculated automatically
        products: orderData.items.map((product, index) => ({
            quantity: product.quantity,
            description: product.item.name,
            "tax-rate": 0, // Replace with appropriate tax rate for each product
            price: product.item.offerPrice,
          })),
        // The message you would like to display on the bottom of your invoice
        "bottom-notice": "Kindly pay your invoice within 15 days.",
        // Settings to customize your invoice
        "settings": {
            "currency": "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
            // "locale": "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')        
            // "margin-top": 25, // Defaults to '25'
            // "margin-right": 25, // Defaults to '25'
            // "margin-left": 25, // Defaults to '25'
            // "margin-bottom": 25, // Defaults to '25'
            // "format": "A4", // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
            // "height": "1000px", // allowed units: mm, cm, in, px
            // "width": "500px", // allowed units: mm, cm, in, px
            // "orientation": "landscape", // portrait or landscape, defaults to portrait
        },
        // Translate your invoice to your preferred language
        "translate": {
            // "invoice": "FACTUUR",  // Default to 'INVOICE'
            // "number": "Nummer", // Defaults to 'Number'
            // "date": "Datum", // Default to 'Date'
            // "due-date": "Verloopdatum", // Defaults to 'Due Date'
            // "subtotal": "Subtotaal", // Defaults to 'Subtotal'
            // "products": "Producten", // Defaults to 'Products'
            // "quantity": "Aantal", // Default to 'Quantity'
            // "price": "Prijs", // Defaults to 'Price'
            // "product-total": "Totaal", // Defaults to 'Total'
            // "total": "Totaal", // Defaults to 'Total'
            // "vat": "btw" // Defaults to 'vat'
        },
    };
    
    //Create your invoice! Easy!
    easyinvoice.createInvoice(data,async function (result) {
        //The response will contain a base64 encoded PDF file
       fs.writeFileSync(`/hobnob ecommerce/public/pdf/${orderData._id}.pdf`,result.pdf, 'base64')
    });
}

module.exports = {
    downloadInvoice
}