import pandas as pd
import os

def xlsx_to_csv(xlsx_file_path, output_directory=None):
    """
    Convert each sheet in an Excel file to separate CSV files
    
    Args:
        xlsx_file_path (str): Path to the Excel file
        output_directory (str): Directory to save CSV files (optional)
    """
    
    # Create output directory if not specified
    if output_directory is None:
        output_directory = os.path.splitext(xlsx_file_path)[0] + "_csv_files"
    
    # Create output directory if it doesn't exist
    os.makedirs(output_directory, exist_ok=True)
    
    try:
        # Read all sheets from the Excel file
        excel_file = pd.ExcelFile(xlsx_file_path)
        
        print(f"Found {len(excel_file.sheet_names)} sheets in the Excel file:")
        
        for sheet_name in excel_file.sheet_names:
            print(f"Processing sheet: {sheet_name}")
            
            # Read the sheet
            df = pd.read_excel(xlsx_file_path, sheet_name=sheet_name)
            
            # Create a valid filename (remove invalid characters)
            safe_sheet_name = "".join(c for c in sheet_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
            csv_filename = f"{safe_sheet_name}.csv"
            csv_path = os.path.join(output_directory, csv_filename)
            
            # Save to CSV
            df.to_csv(csv_path, index=False)
            print(f"Saved: {csv_path}")
        
        print(f"\nAll sheets converted successfully!")
        print(f"CSV files saved in: {output_directory}")
        
    except Exception as e:
        print(f"Error: {e}")

# Example usage
if __name__ == "__main__":
    # Replace with your Excel file path
    xlsx_file = "givenData/Database for Grade XI-2025-26.xlsx"
    
    # Optional: specify output directory
    output_dir = "csv_output"
    
    xlsx_to_csv(xlsx_file, output_dir)
