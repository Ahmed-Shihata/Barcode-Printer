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
                
                // Create print window with barcode
                print_barcode_window(imageUrl, frm.doc.item_name, frm.doc.name, lastBarcode.barcode);
                
                frappe.msgprint(__('Printing barcode for: ') + lastBarcode.barcode);
            }
        },
        error: function(error) {
            frappe.msgprint(__('Error generating barcode: ') + error.message);
        }
    });
}

function print_barcode_window(imageUrl, itemName, itemCode, barcodeValue) {
    // Create new window for printing
    let printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Barcode</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        margin: 20px;
                    }
                    .barcode-container {
                        border: 1px solid #ccc;
                        padding: 20px;
                        display: inline-block;
                        margin: 20px;
                    }
                    .item-info {
                        margin-bottom: 15px;
                        font-size: 14px;
                    }
                    .barcode-image {
                        margin: 10px 0;
                    }
                    @media print {
                        body { margin: 0; }
                        .barcode-container { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="barcode-container">
                    <div class="item-info">
                        <strong>Item:</strong> ${itemName}<br>
                        <strong>Code:</strong> ${itemCode}<br>
                        <strong>Barcode:</strong> ${barcodeValue}
                    </div>
                    <div class="barcode-image">
                        <img src="${imageUrl}" alt="Barcode" style="max-width: 300px;">
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
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
    }, 1000);
}
