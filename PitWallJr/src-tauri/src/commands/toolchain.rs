use serde::Serialize;

#[derive(Serialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ProgrammerStatus {
    Ok,
    NotInstalled,
}

#[derive(Serialize)]
pub struct ToolchainStatus {
    pub gcc: bool,
    pub make: bool,
    pub programmer: ProgrammerStatus,
    pub gcc_version: Option<String>,
}

fn probe(bin: &str) -> bool {
    std::process::Command::new(bin)
        .arg("--version")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .and_then(|mut c| c.wait())
        .map(|s| s.success())
        .unwrap_or(false)
}

#[tauri::command]
pub fn check_toolchain() -> ToolchainStatus {
    let gcc_out = std::process::Command::new("arm-none-eabi-gcc")
        .arg("--version")
        .output();

    ToolchainStatus {
        gcc: gcc_out.is_ok(),
        make: probe("make"),
        programmer: if probe("STM32_Programmer_CLI") {
            ProgrammerStatus::Ok
        } else {
            ProgrammerStatus::NotInstalled
        },
        gcc_version: gcc_out.ok().and_then(|o| {
            String::from_utf8(o.stdout)
                .ok()
                .and_then(|s| s.lines().next().map(str::to_string))
        }),
    }
}
