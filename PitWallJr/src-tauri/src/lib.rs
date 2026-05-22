mod commands;

use commands::build::build_and_flash;
use commands::fs::{load_setup_json, save_setup_json, write_config_h};
use commands::toolchain::check_toolchain;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            write_config_h,
            save_setup_json,
            load_setup_json,
            check_toolchain,
            build_and_flash,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
