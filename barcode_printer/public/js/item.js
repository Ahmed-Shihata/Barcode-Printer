frappe.ui.form.on('Item', {
    refresh: function(frm) {
        // Add Print Barcode button without group
        frm.add_custom_button(__('Print Barcode'), function() {
            print_barcode(frm);
        });
    }
});

function print_barcode(frm) {
    // Get the last added barcode from the item_barcode child table
    let barcodes = frm.doc.barcodes || [];
    
    if (barcodes.length === 0) {
        frappe.msgprint(__('No barcode found for this item'));
        return;
    }
    
    // Get the last added barcode (highest idx)
    let lastBarcode = barcodes.slice(-1)[0];
    
    frappe.call({
        method: 'barcode_printer.api.print_item_barcode',
        args: {
            'item_code': frm.doc.name,
            'item_name': frm.doc.item_name,
            'barcode_value': lastBarcode.barcode,
            'uom': lastBarcode.uom || frm.doc.stock_uom
        },
        callback: function(response) {
            if (response.message) {
                // Create printable content
                let filedata = response.message;
                
                // Convert base64 to blob
                let imageBlob = new Blob([Uint8Array.from(atob(filedata.filecontent), c => c.charCodeAt(0))], {
                    type: 'image/png'
                });
                
                // Create object URL
                let imageUrl = window.URL.createObjectURL(imageBlob);
                
                // Create print window with exact card format
                print_barcode_card(imageUrl, lastBarcode.barcode);
                
                frappe.msgprint(__('Printing barcode card for: ') + lastBarcode.barcode);
            }
        },
        error: function(error) {
            frappe.msgprint(__('Error generating barcode: ') + error.message);
        }
    });
}

function print_barcode_card(imageUrl, barcodeValue) {
    // Create new window for printing
    let printWindow = window.open('', '_blank', 'width=400,height=300');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Barcode Card</title>
                <style>
                    @page {
                        size: 85mm 54mm;
                        margin: 0;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    html, body {
                        width: 85mm;
                        height: 54mm;
                        margin: 0;
                        padding: 0;
                        background: white;
                        overflow: hidden;
                    }
                    
                    .card-container {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        background: white;
                        padding: 3mm;
                    }
                    
                    .barcode-image {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    
                    .barcode-image img {
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }
                    
                    @media print {
                        html, body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="card-container">
                    <div class="barcode-image">
                        <img src="${imageUrl}" alt="Barcode">
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                        
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Clean up the object URL after a delay
    setTimeout(() => {
        window.URL.revokeObjectURL(imageUrl);
    }, 2000);
}
