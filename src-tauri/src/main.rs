// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use tauri::{Manager, Runtime};

// This function is needed to configure window shadows on macOS
#[cfg(target_os = "macos")]
pub trait WindowExt {
    fn set_win_effects(&self) -> tauri::Result<()>;
}

#[cfg(target_os = "macos")]
impl<R: Runtime> WindowExt for tauri::Window<R> {
    fn set_win_effects(&self) -> tauri::Result<()> {
        use cocoa::appkit::{NSWindow, NSWindowStyleMask};
        use cocoa::base::{id, nil, YES};
        use cocoa::foundation::NSAutoreleasePool;

        use objc::{msg_send, sel, sel_impl};

        unsafe {
            let pool = NSAutoreleasePool::new(nil);
            let ns_window = self.ns_window().unwrap() as id;

            // Enable full-size content view
            let style_mask = ns_window.styleMask();
            ns_window
                .setStyleMask_(style_mask | NSWindowStyleMask::NSFullSizeContentViewWindowMask);

            // Set titlebar transparent
            ns_window.setTitlebarAppearsTransparent_(YES);

            // Enable window shadows
            let _: () = msg_send![ns_window, setHasShadow: YES];

            pool.drain();
        }
        Ok(())
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() > 1 {
        let command = &args[1];

        match command.as_str() {
            "read-books" => {
                let json_path = &args[2];
                println!("Reading books json...");
                match litforge_notes_lib::import_books(&json_path) {
                    Ok(_) => println!("Books imported correctly!"),
                    Err(e) => println!("Error importing books: {e}"),
                }
            }
            "read-notes" => {
                let json_path = &args[2];
                println!("Reading notes json...");
                match litforge_notes_lib::import_notes(&json_path) {
                    Ok(_) => println!("Notes imported correctly!"),
                    Err(e) => println!("Error importing notes: {e}"),
                }
            }
            _ => println!("Invalid command {command}"),
        }
    } else {
        // In Tauri 2.0, we need to use the plugin system differently
        tauri::Builder::default()
            .plugin(tauri_plugin_os::init())
            .plugin(tauri_plugin_shell::init())
            .setup(|app| {
                // Initialize the database
                let conn = litforge_notes_lib::db::get_connection().expect("Failed to get database connection");
                litforge_notes_lib::db::init_db(&conn).expect("Failed to initialize database");
                
                #[cfg(target_os = "macos")]
                {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.set_win_effects();
                    }
                }
                Ok(())
            })
            .invoke_handler(tauri::generate_handler![
                litforge_notes_lib::commands::fetch_all,
                litforge_notes_lib::commands::fetch_book_notes,
                litforge_notes_lib::commands::fetch_books_by_author,
                litforge_notes_lib::commands::new_author,
                litforge_notes_lib::commands::new_book,
                litforge_notes_lib::commands::new_note,
                litforge_notes_lib::commands::update_note,
                litforge_notes_lib::commands::star_note,
                litforge_notes_lib::commands::hide_note,
                litforge_notes_lib::commands::search_notes,
                litforge_notes_lib::commands::search_books_by_title,
                litforge_notes_lib::commands::search_authors_by_name,
                litforge_notes_lib::commands::set_note_starred,
                litforge_notes_lib::commands::set_book_deleted,
                litforge_notes_lib::commands::set_author_deleted,
                litforge_notes_lib::commands::get_random_quote,
                litforge_notes_lib::commands::fetch_starred_notes,
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
}
