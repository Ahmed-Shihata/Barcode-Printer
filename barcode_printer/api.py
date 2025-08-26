import frappe
import os
import base64
from io import BytesIO

@frappe.whitelist()
def print_item_barcode(item_code, item_name, barcode_value, uom=None):
    """Generate barcode image for printing"""
    
    try:
        # Import barcode library with error handling
        try:
            import barcode
            from barcode.writer import ImageWriter
        except ImportError as e:
            frappe.throw(f"Barcode library not installed: {str(e)}")
        
        # Generate barcode image
        barcode_image_data = generate_barcode_image(barcode_value)
        
        # Return base64 encoded image for printing
        return {
            "status": "success",
            "message": f"Barcode generated for {barcode_value}",
            "filename": f"barcode_{item_code}.png",
            "filecontent": base64.b64encode(barcode_image_data).decode()
        }
        
    except Exception as e:
        frappe.throw(f"Error generating barcode: {str(e)}")

def generate_barcode_image(barcode_value):
    """Generate barcode PNG image"""
    
    import barcode
    from barcode.writer import ImageWriter
    
    # Use Code128 format
    Code128 = barcode.get_barcode_class('code128')
    barcode_instance = Code128(str(barcode_value), writer=ImageWriter())
    
    # Generate image in memory
    buffer = BytesIO()
    barcode_instance.write(buffer)
    buffer.seek(0)
    
    return buffer.getvalue()
