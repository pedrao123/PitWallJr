use std::io::BufRead;
use tauri::Emitter;

fn stream_child(
    mut child: std::process::Child,
    handle: tauri::AppHandle,
) -> Result<bool, String> {
    if let Some(stdout) = child.stdout.take() {
        let h = handle.clone();
        std::thread::spawn(move || {
            for line in std::io::BufReader::new(stdout).lines().flatten() {
                h.emit("build-log", &line).ok();
            }
        });
    }
    if let Some(stderr) = child.stderr.take() {
        let h = handle.clone();
        std::thread::spawn(move || {
            for line in std::io::BufReader::new(stderr).lines().flatten() {
                h.emit("build-log-err", &line).ok();
            }
        });
    }
    child.wait().map(|s| s.success()).map_err(|e| e.to_string())
}

fn find_fresh_elf(project_path: &str) -> Result<String, String> {
    let output = std::process::Command::new("find")
        .args([project_path, "-name", "*.elf", "-type", "f"])
        .output()
        .map_err(|e| format!("Erro ao buscar .elf: {e}"))?;

    let mut elfs: Vec<(std::time::SystemTime, std::path::PathBuf)> =
        String::from_utf8_lossy(&output.stdout)
            .lines()
            .filter_map(|p| {
                let path = std::path::Path::new(p);
                let mtime = path.metadata().ok()?.modified().ok()?;
                Some((mtime, path.to_path_buf()))
            })
            .collect();

    if elfs.is_empty() {
        return Err(
            "Nenhum arquivo .elf encontrado no projeto após o build — verifique se o Makefile gera um ELF"
                .to_string(),
        );
    }

    // Usa o mais recente (o que acabou de ser compilado)
    elfs.sort_by(|a, b| b.0.cmp(&a.0));
    Ok(elfs[0].1.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn build_and_flash(
    project_path: String,
    app_handle: tauri::AppHandle,
) -> Result<bool, String> {
    // ── Step 1: make ─────────────────────────────────────────
    app_handle.emit("build-log", "── make ─────────────────────────────────────────").ok();

    let make_child = std::process::Command::new("make")
        .args(["-C", &project_path, "all"])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Erro ao iniciar make: {e}"))?;

    let build_ok = stream_child(make_child, app_handle.clone())?;

    if !build_ok {
        app_handle.emit("build-done", false).ok();
        return Ok(false);
    }

    // ── Localizar o .elf gerado ───────────────────────────────
    let elf_path = match find_fresh_elf(&project_path) {
        Ok(p) => {
            app_handle.emit("build-log", &format!("ELF: {p}")).ok();
            p
        }
        Err(e) => {
            app_handle.emit("build-log-err", &e).ok();
            app_handle.emit("build-done", false).ok();
            return Ok(false);
        }
    };

    // ── Step 2: flash ────────────────────────────────────────
    app_handle.emit("build-log", "── STM32_Programmer_CLI ─────────────────────────").ok();

    let flash_child = std::process::Command::new("STM32_Programmer_CLI")
        .args(["-c", "port=SWD", "-w", &elf_path, "-v", "-rst"])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "STM32_Programmer_CLI não encontrado no PATH".to_string()
            } else {
                format!("Erro ao iniciar STM32_Programmer_CLI: {e}")
            }
        })?;

    let flash_ok = stream_child(flash_child, app_handle.clone())?;

    if !flash_ok {
        app_handle.emit("build-log-err", "").ok();
        app_handle
            .emit("build-log-err", "⚠  Se o erro for \"No ST-LINK detected\", verifique as regras udev:")
            .ok();
        app_handle
            .emit("build-log-err", "   echo 'SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0483\", ATTRS{idProduct}==\"374b\", MODE=\"0666\"' \\")
            .ok();
        app_handle
            .emit("build-log-err", "     | sudo tee /etc/udev/rules.d/49-stlinkv2.rules")
            .ok();
        app_handle
            .emit("build-log-err", "   sudo udevadm control --reload-rules && sudo udevadm trigger")
            .ok();
    }

    app_handle.emit("build-done", flash_ok).ok();
    Ok(flash_ok)
}
