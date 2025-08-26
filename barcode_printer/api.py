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
    """Generate barcode PNG image with proper sizing to prevent text cutoff"""
    
    import barcode
    from barcode.writer import ImageWriter
    
    # Custom options to prevent text cutoff
    options = {
        'module_width': 0.4,        # Width of individual bars
        'module_height': 25.0,      # Height of bars
        'quiet_zone': 15.0,         # More white space to prevent cutoff
        'font_size': 14,            # Font size for numbers
        'text_distance': 8.0,       # Distance between bars and text
        'background': 'white',      # Background color
        'foreground': 'black',      # Barcode color
        'center_text': True,        # Center the text properly
        'dpi': 300                  # High DPI for crisp print
    }
    
    # Use Code128 format with custom writer
    Code128 = barcode.get_barcode_class('code128')
    writer = ImageWriter()
    
    # Set options using the writer
    barcode_instance = Code128(str(barcode_value), writer=writer)
    
    # Generate image in memory with options
    buffer = BytesIO()
    barcode_instance.write(buffer, options)
    buffer.seek(0)
    
    return buffer.getvalue()
