// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::KeyboardInput { event: key_event, .. } = event {
                if key_event.key == "F12" && key_event.state == tauri::keyboard::KeyState::Pressed {
                    if window.is_devtools_open() {
                        window.close_devtools();
                    } else {
                        window.open_devtools();
                    }
                }
            }
        })
        .setup(|app| {
            let _ = app.handle().plugin(tauri_plugin_shell::init());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}