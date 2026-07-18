import os
from PIL import Image

# 1. Path to your images folder. 
# Relative to where you run this script, or use an absolute path like 'C:/Users/Name/Project/images'
folder_path = "images" 

# Extensions to convert (case-insensitive)
source_extensions = ('.png', '.jpeg', '.webp')

# Ensure the folder exists
if not os.path.exists(folder_path):
    print(f"Folder '{folder_path}' does not exist. Please check the path.")
    exit()

print(f"Scanning folder: {folder_path}...")

for filename in os.listdir(folder_path):
    # Check if file matches target extensions
    if filename.lower().endswith(source_extensions):
        file_path = os.path.join(folder_path, filename)
        
        try:
            # Open the image
            with Image.open(file_path) as img:
                # Handle transparency (RGBA mode) by placing it on a white background
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    # Use alpha channel as mask
                    background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else img.split()[1])
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Create the new filename with .jpg extension
                base_name = os.path.splitext(filename)[0]
                new_filename = f"{base_name}.jpg"
                new_file_path = os.path.join(folder_path, new_filename)
                
                # Save as JPEG with maximum quality and no color subsampling
                img.save(new_file_path, 'JPEG', quality=100, subsampling=0)
                print(f"Converted: {filename} -> {new_filename}")
                
                # OPTIONAL: If you want to automatically delete the original non-JPG file 
                # after a successful conversion, uncomment the line below:
                # os.remove(file_path)
                
        except Exception as e:
            print(f"Failed to convert {filename}: {e}")

print("Process finished!")