use std::path::Path;

#[tauri::command]
pub fn write_config_h(content: String, dest_path: String) -> Result<(), String> {
    let path = Path::new(&dest_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Erro ao criar diretório: {e}"))?;
    }
    std::fs::write(path, content)
        .map_err(|e| format!("Erro ao escrever config.h: {e}"))
}

#[tauri::command]
pub fn save_setup_json(content: String, dest_path: String) -> Result<(), String> {
    let path = Path::new(&dest_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Erro ao criar diretório: {e}"))?;
    }
    std::fs::write(path, content)
        .map_err(|e| format!("Erro ao salvar setup: {e}"))
}

#[tauri::command]
pub fn load_setup_json(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Erro ao carregar setup: {e}"))
}
